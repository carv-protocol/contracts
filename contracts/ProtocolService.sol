// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";
import "./interfaces/IProtocolService.sol";
import "./interfaces/ICarvVrfCallback.sol";
import "./interfaces/ICarvVrf.sol";
import "./interfaces/ISettings.sol";
import "./interfaces/IVault.sol";
import "./Adminable.sol";

contract ProtocolService is IProtocolService, ICarvVrfCallback, Adminable, Multicall {

    uint16 public constant MAX_UINT16 = 65535; // type(uint16).max;
    bytes32 public constant EIP712_DOMAIN_HASH = keccak256(
        abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId)"),
            keccak256(bytes("ProtocolService")),
            keccak256(bytes("0.1.0")),
            42161
        )
    );

    address public vault;
    address public carvToken;
    address public carvNft;
    address public settings;
    address public carvVrf;

    uint16 public nodeIndex;
    uint16[] public activeVrfNodeList;

    uint32 public vrfChosenIndex;
    mapping(uint32 => uint16[]) public vrfChosenMap;

    mapping(uint16 => address) public nodeAddrByID;
    mapping(uint256 => address) public delegation;
    mapping(address => uint16) public delegationWeights;
    mapping(address => NodeInfo) public nodeInfos;
    mapping(uint256 => TokenRewardInfo) public tokenRewardInfos;
    mapping(address => TeeStakeInfo) public teeStakeInfos;
    mapping(bytes32 => Attestation) public attestations;
    mapping(uint256 => bytes32[]) public request2AttestationIDs;
    mapping(bytes32 => mapping(address => bool)) public attestationVerifiedNode;
    mapping(address => mapping(bytes32 => bool)) public nodeSlashed;
    mapping(address => mapping(bytes32 => bool)) public nodeClaimedTeeRewards;
    mapping(uint32 => uint32) public globalDailyActiveNodes;
    mapping(address => mapping(uint32 => uint32)) public nodeDailyActive;

    function initialize(
        address carvToken_, address carvNft_, address vault_
    ) public initializer {
        carvToken = carvToken_;
        carvNft = carvNft_;
        vault= vault_;
        __Adminable_init(msg.sender);
    }

    function updateSettingsAddress(address settings_) external onlyAdmin {
        settings = settings_;
        emit UpdateSettingsAddress(settings_);
    }

    function updateVrfAddress(address carvVrf_) external onlyAdmin {
        carvVrf = carvVrf_;
        emit UpdateVrfAddress(carvVrf_);
    }

    // CARV to veCARV, stored in Vault
    function teeStake(uint256 amount) external onlyTee {
        IERC20(carvToken).transferFrom(msg.sender, vault, amount);
        IVault(vault).teeDeposit(amount);

        TeeStakeInfo storage teeStakeInfo = teeStakeInfos[msg.sender];
        teeStakeInfo.staked += amount;
        require(teeStakeInfo.staked >= ISettings(settings).minTeeStakeAmount(), "Not meet minTeeStakeAmount");
        teeStakeInfo.valid = true;

        emit TeeStake(msg.sender, amount);
    }

    // return veCARV to tee
    function teeUnstake() external onlyTee {
        TeeStakeInfo storage info = teeStakeInfos[msg.sender];
        require(
            block.timestamp - info.lastReportAt >= ISettings(settings).teeUnstakeDuration(),
            "Locking"
        );

        uint256 amount = info.staked;
        info.valid = false;
        info.staked = 0;

        IVault(vault).teeWithdraw(msg.sender, amount);
        emit TeeUnstake(msg.sender, amount);
    }

    function teeSlash(bytes32 attestationID) external {
        Attestation storage attestation = attestations[attestationID];
        require(!attestation.slashed, "Already slashed");
        require(attestation.deadline < block.timestamp, "Deadline");
        require(attestation.valid < attestation.malicious, "Valid attestation");
        address tee = attestation.reporter;
        TeeStakeInfo storage info = teeStakeInfos[tee];
        require(info.valid, "Invalid tee");

        uint256 totalSlash = ISettings(settings).teeSlashAmount() * (attestation.valid + attestation.invalid + attestation.malicious);
        info.staked -= totalSlash;
        if (info.staked < ISettings(settings).minTeeStakeAmount()) {
            info.valid = false;
        }
        attestation.slashed = true;

        emit TeeSlash(tee, attestationID, totalSlash);
    }

    function claimMaliciousTeeRewards(bytes32 attestationID) external {
        require(attestations[attestationID].slashed, "Not slashed");
        require(attestationVerifiedNode[attestationID][msg.sender], "Not verified");
        require(!nodeClaimedTeeRewards[msg.sender][attestationID], "Already claimed");

        uint256 reward = ISettings(settings).teeSlashAmount();
        IVault(vault).teeWithdraw(msg.sender, reward);
        nodeClaimedTeeRewards[msg.sender][attestationID] = true;

        emit ClaimMaliciousTeeRewards(msg.sender, reward);
    }

    function teeReportAttestations(string[] memory attestationInfos) external onlyTee {
        TeeStakeInfo storage tee = teeStakeInfos[msg.sender];
        require(tee.valid, "Invalid");
        tee.lastReportAt = block.timestamp;

        uint256 requestId = ICarvVrf(carvVrf).requestRandomWords();

        bytes32[] memory attestationIDs = new bytes32[](attestationInfos.length);
        for (uint index = 0; index < attestationInfos.length; index++) {
            bytes32 attestationID = keccak256(bytes(attestationInfos[index]));
            require(attestations[attestationID].reporter == address(0), "Already reported");
            Attestation storage attestation = attestations[attestationID];
            attestation.reporter = msg.sender;
            attestationIDs[index] = attestationID;
        }

        request2AttestationIDs[requestId] = attestationIDs;
        emit TeeReportAttestations(msg.sender, attestationIDs, attestationInfos, requestId);
    }

    function nodeEnter(address replacedNode) external {
        _nodeEnter(msg.sender, replacedNode);
    }

    function nodeExit() external {
        _nodeExit(msg.sender);
    }

    function nodeModifyCommissionRate(uint32 commissionRate) external {
        _nodeModifyCommissionRate(msg.sender, commissionRate);
    }

    function nodeModifyCommissionRateWithSignature(
        uint32 commissionRate, uint256 expiredAt, address signer, uint8 v, bytes32 r, bytes32 s
    ) external {
        bytes32 hashStruct = keccak256(
            abi.encode(
                keccak256(
                    "NodeModifyCommissionRateData(uint32 commissionRate,uint256 expiredAt)"
                ),
                commissionRate,
                expiredAt
            )
        );
        _checkSignature(expiredAt, hashStruct, signer, v, r, s);
        _nodeModifyCommissionRate(signer, commissionRate);
    }

    function nodeEnterWithSignature(
        address replacedNode, uint256 expiredAt, address signer, uint8 v, bytes32 r, bytes32 s
    ) external {
        bytes32 hashStruct = keccak256(
            abi.encode(
                keccak256(
                    "NodeEnterData(address replacedNode,uint256 expiredAt)"
                ),
                replacedNode,
                expiredAt
            )
        );
        _checkSignature(expiredAt, hashStruct, signer, v, r, s);
        _nodeEnter(signer, replacedNode);
    }

    function nodeExitWithSignature(
        uint256 expiredAt, address signer, uint8 v, bytes32 r, bytes32 s
    ) external {
        bytes32 hashStruct = keccak256(
            abi.encode(
                keccak256(
                    "NodeExitData(uint256 expiredAt)"
                ),
                expiredAt
            )
        );
        _checkSignature(expiredAt, hashStruct, signer, v, r, s);
        _nodeExit(signer);
    }

    function nodeSetRewardClaimerWithSignature(
        address claimer, uint256 expiredAt, address signer, uint8 v, bytes32 r, bytes32 s
    ) external {
        bytes32 hashStruct = keccak256(
            abi.encode(
                keccak256(
                    "NodeSetRewardClaimerData(address claimer,uint256 expiredAt)"
                ),
                claimer,
                expiredAt
            )
        );
        _checkSignature(expiredAt, hashStruct, signer, v, r, s);
        nodeInfos[signer].claimer = claimer;
        emit NodeSetClaimer(signer, claimer);
    }

    function nodeClaim(address node) external {
        NodeInfo storage nodeInfo = nodeInfos[node];
        require(nodeInfo.id > 0, "Not register");
        require(msg.sender == node || msg.sender == nodeInfo.claimer, "Cannot claim");
        _confirmNodeRewards(node);
        require(nodeInfo.selfTotalRewards > int256(nodeInfo.selfClaimedRewards), "No reward");

        uint256 rewards = uint256(nodeInfo.selfTotalRewards) - nodeInfo.selfClaimedRewards;
        nodeInfo.selfClaimedRewards = uint256(nodeInfo.selfTotalRewards);

        IVault(vault).rewardsWithdraw(msg.sender, rewards);
        emit NodeClaim(node, msg.sender, rewards);
    }

    function nodeSlash(address node, bytes32 attestationID, uint16 index) external {
        Attestation storage attestation = attestations[attestationID];
        require(attestation.deadline > block.timestamp, "Deadline");

        NodeInfo storage nodeInfo = nodeInfos[node];
        require(!nodeSlashed[node][attestationID], "Already slashed");
        require(vrfChosenMap[attestation.vrfChosenID][index] == nodeInfo.id, "Not chosen");
        require(!attestationVerifiedNode[attestationID][node], "Node verified");

        uint256 reward = ISettings(settings).nodeSlashReward();
        nodeInfo.missedVerifyCount += 1;
        nodeInfo.selfTotalRewards -= int256(reward);
        nodeSlashed[node][attestationID] = true;
        IVault(vault).rewardsWithdraw(msg.sender, reward);

        if (nodeInfo.missedVerifyCount >= ISettings(settings).nodeMaxMissVerifyCount()) {
            // too many miss, force exit
            _nodeExit(node);
        }

        emit NodeSlash(node, attestationID, reward);
    }

    function nodeReportDailyActive(address node) external {
        require(nodeInfos[node].active, "Inactive node");
        _updateNodeDailyActive(node);
        _confirmNodeRewards(node);
    }

    function nodeReportVerification(bytes32 attestationID, uint16 index, AttestationResult result) external {
        Attestation storage attestation = attestations[attestationID];
        _checkAttestation(attestation);
        _checkNodeInfos(attestationID, msg.sender, index);

        if (result == AttestationResult.Valid) {
            attestation.valid += 1;
        } else if (result == AttestationResult.Invalid) {
            attestation.invalid += 1;
        } else if (result == AttestationResult.Malicious) {
            attestation.malicious += 1;
        } else {
            revert("Unknown AttestationResult");
        }
        attestationVerifiedNode[attestationID][msg.sender] = true;
        emit NodeReportVerification(msg.sender, attestationID, result);
    }

    function nodeReportVerificationBatch(bytes32 attestationID, VerificationInfo[] calldata infos) external {
        Attestation storage attestation = attestations[attestationID];
        _checkAttestation(attestation);

        uint16 valid;
        uint16 invalid;
        uint16 malicious;
        for (uint i = 0; i < infos.length; i++) {
            bytes32 hashStruct = keccak256(
                abi.encode(
                    keccak256(
                        "VerificationData(bytes32 attestationID,uint8 result,uint16 index)"
                    ),
                    attestationID,
                    infos[i].result,
                    infos[i].index
                )
            );
            _checkSignature(block.timestamp, hashStruct, infos[i].signer, infos[i].v, infos[i].r, infos[i].s);
            _checkNodeInfos(attestationID, infos[i].signer, infos[i].index);

            if (infos[i].result == AttestationResult.Valid) {
                valid++;
            } else if (infos[i].result == AttestationResult.Invalid) {
                invalid++;
            } else if (infos[i].result == AttestationResult.Malicious) {
                malicious++;
            } else {
                revert("Unknown AttestationResult");
            }
            attestationVerifiedNode[attestationID][infos[i].signer] = true;
        }

        attestation.valid += valid;
        attestation.invalid += invalid;
        attestation.malicious += malicious;

        emit NodeReportVerificationBatch(attestationID, infos);
    }

    function delegate(uint256 tokenID, address to) external onlyNftOwner(tokenID) {
        require(delegation[tokenID] == address(0), "Already delegate");
        require(delegationWeights[to] < ISettings(settings).maxNodeWeights(), "Max node weights");

        delegation[tokenID] = to;
        delegationWeights[to] += 1;

        tokenRewardInfos[tokenID].initialRewards = nodeInfos[to].delegationRewards;
        emit Delegate(tokenID, to);
    }

    function redelegate(uint256 tokenID, address to) external onlyNftOwner(tokenID) {
        address old = delegation[tokenID];
        require(old != address(0) && old != to, "Cannot redelegate or redelegate to same one");
        require(delegationWeights[to] < ISettings(settings).maxNodeWeights(), "Max node weights");

        delegation[tokenID] = to;
        delegationWeights[to] += 1;
        delegationWeights[old] -= 1;
        if (nodeInfos[old].active && delegationWeights[old] == 0) {
            _nodeExit(old);
        }

        TokenRewardInfo storage rewardInfo = tokenRewardInfos[tokenID];
        rewardInfo.totalRewards += nodeInfos[old].delegationRewards - rewardInfo.initialRewards;
        rewardInfo.initialRewards = nodeInfos[to].delegationRewards;

        emit Redelegate(tokenID, to);
    }

    function undelegate(uint256 tokenID) external onlyNftOwner(tokenID) {
        address old = delegation[tokenID];
        require(old != address(0), "Not delegate");

        delegation[tokenID] = address(0);
        delegationWeights[old] -= 1;
        if (nodeInfos[old].active && delegationWeights[old] == 0) {
            _nodeExit(old);
        }

        TokenRewardInfo storage rewardInfo = tokenRewardInfos[tokenID];
        rewardInfo.totalRewards += nodeInfos[old].delegationRewards - rewardInfo.initialRewards;

        emit Undelegate(tokenID, old);
    }

    function claimRewards(uint256 tokenID) external onlyNftOwner(tokenID) {
        TokenRewardInfo storage rewardInfo = tokenRewardInfos[tokenID];
        if (delegation[tokenID] != address(0)) {
            rewardInfo.totalRewards += nodeInfos[delegation[tokenID]].delegationRewards - rewardInfo.initialRewards;
            rewardInfo.initialRewards = nodeInfos[delegation[tokenID]].delegationRewards;
        }

        require(rewardInfo.totalRewards > rewardInfo.claimedRewards, "No reward");
        uint256 rewards = rewardInfo.totalRewards - rewardInfo.claimedRewards;
        rewardInfo.claimedRewards = rewardInfo.totalRewards;
        IVault(vault).rewardsWithdraw(msg.sender, rewards);

        emit ClaimRewards(tokenID, rewards);
    }

    function checkClaimed(uint256 tokenID) external view returns (bool) {
        return tokenRewardInfos[tokenID].totalRewards > 0;
    }

    function todayIndex() public view returns (uint32) {
        return uint32((block.timestamp - IVault(vault).startTimestamp()) / (1 days));
    }

    function todayOffset() public view returns (uint256) {
        return (block.timestamp - IVault(vault).startTimestamp()) % (1 days);
    }

    /*----------------------------------------- internal functions --------------------------------------------*/

    // chainlink VRF callback function
    // According to random words, emit event to decide nodes verifying
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external onlyCarvVrf override {
        require(randomWords.length > 0, "Wrong randomWords");

        uint256 deadline = block.timestamp + ISettings(settings).nodeVerifyDuration();
        uint16[] memory vrfChosen = _vrfChooseNodes(randomWords[0]);
        vrfChosenIndex++;
        vrfChosenMap[vrfChosenIndex] = vrfChosen;

        bytes32[] memory attestationIDs = request2AttestationIDs[requestId];
        for (uint index = 0; index < attestationIDs.length; index++) {
            Attestation storage attestation = attestations[attestationIDs[index]];
            attestation.deadline = deadline;
            attestation.vrfChosenID = vrfChosenIndex;
        }

        emit ConfirmVrfNodes(requestId, vrfChosen, deadline);
    }

    // if number of active nodes is less than 10, choose all active nodes
    // if number of active nodes is more than 10 and less than 100, choose 10 active nodes randomly
    // if number of active node is more than 100, choose 1/10 of active nodes randomly
    function _vrfChooseNodes(uint256 randomWord) internal view returns (uint16[] memory) {
        if (activeVrfNodeList.length <= 10) {
            return activeVrfNodeList;
        }

        uint16 curIndex = uint16(randomWord % activeVrfNodeList.length);
        uint16 length = 10;
        if (activeVrfNodeList.length > 100) {
            length = uint16(activeVrfNodeList.length/10);
        }

        uint16[] memory chosenNodes = new uint16[](length);
        for (uint16 i=0; i<length; i++) {
            chosenNodes[i] = activeVrfNodeList[curIndex];
            curIndex = (curIndex+1) % uint16(activeVrfNodeList.length);
        }
        return chosenNodes;
    }

    function _nodeEnter(address node, address replacedNode) internal {
        require(delegationWeights[node] > 0, "No delegationWeights");
        if (nodeInfos[node].id == 0) {
            _nodeRegister(node);
        }

        require(!nodeInfos[node].active, "Already enter");

        if (activeVrfNodeList.length < ISettings(settings).maxVrfActiveNodes()) {
            activeVrfNodeList.push(nodeInfos[node].id);
            _nodeActivate(node, uint16(activeVrfNodeList.length)-1);
            return;
        }

        require(delegationWeights[node] > delegationWeights[replacedNode], "Less weights");
        NodeInfo storage replacedNodeInfo = nodeInfos[replacedNode];
        activeVrfNodeList[replacedNodeInfo.listIndex] = nodeInfos[node].id;
        _nodeActivate(node, replacedNodeInfo.listIndex);
        _nodeClear(replacedNode);
    }

    function _nodeExit(address node) internal {
        require(nodeInfos[node].active, "Already exit");
        if (nodeInfos[node].listIndex != activeVrfNodeList.length - 1 ) {
            uint16 tailNodeId = activeVrfNodeList[activeVrfNodeList.length - 1];
            NodeInfo storage tailNodeInfo = nodeInfos[nodeAddrByID[tailNodeId]];
            activeVrfNodeList[nodeInfos[node].listIndex] = tailNodeInfo.id;
            tailNodeInfo.listIndex = nodeInfos[node].listIndex;
        }
        activeVrfNodeList.pop();
        _nodeClear(node);
    }

    function _nodeModifyCommissionRate(address node, uint32 commissionRate) internal {
        NodeInfo storage nodeInfo = nodeInfos[node];
        require(nodeInfo.id > 0, "Not register");
        require(
            nodeInfo.commissionRateLastModifyAt + ISettings(settings).minCommissionRateModifyInterval() < block.timestamp,
            "Not meet min commission rate modify interval"
        );
        nodeInfo.commissionRate = commissionRate;
        nodeInfo.commissionRateLastModifyAt = block.timestamp;
        emit NodeModifyCommissionRate(node, commissionRate);
    }

    function _nodeActivate(address node, uint16 listIndex) internal {
        NodeInfo storage info = nodeInfos[node];
        info.listIndex = listIndex;
        info.active = true;
        info.lastEnterTime = block.timestamp;

        emit NodeActivate(node);
    }

    function _nodeClear(address node) internal {
        NodeInfo storage info = nodeInfos[node];
        info.listIndex = MAX_UINT16;
        info.active = false;
        info.missedVerifyCount = 0;

        _updateNodeDailyActive(node);
        _confirmNodeRewards(node);
        emit NodeClear(node);
    }

    function _nodeRegister(address node) internal {
        // first enter, assign id
        require(nodeIndex < MAX_UINT16, "Index overflow");
        nodeIndex++;
        NodeInfo storage nodeInfo = nodeInfos[node];
        nodeInfo.id = nodeIndex;
        nodeInfo.listIndex = MAX_UINT16;
        nodeInfo.lastConfirmDate = todayIndex()-1;
        nodeAddrByID[nodeIndex] = node;

        emit NodeRegister(node, nodeIndex);
    }

    function _updateNodeDailyActive(address node) internal {
        uint32 today = todayIndex();
        if (nodeDailyActive[node][today] > 0) {
            return;
        }

        if (
            (block.timestamp - nodeInfos[node].lastEnterTime >= ISettings(settings).nodeMinOnlineDuration())
            &&
            ( todayOffset() >= ISettings(settings).nodeMinOnlineDuration())
        ) {
            nodeDailyActive[node][today] += delegationWeights[node];
            globalDailyActiveNodes[today] += delegationWeights[node];
        }
    }

    function _confirmNodeRewards(address node) internal {
        uint32 today = todayIndex();
        NodeInfo storage nodeInfo = nodeInfos[node];

        if (nodeInfo.lastConfirmDate == today-1) {
            return;
        }

        for (uint32 dateIndex = nodeInfo.lastConfirmDate+1; dateIndex < today; dateIndex++) {
            if (globalDailyActiveNodes[dateIndex] == 0) {
                continue;
            }
            uint256 unitReward = IVault(vault).totalRewardByDate(dateIndex) / globalDailyActiveNodes[dateIndex];
            uint256 commissionReward = (unitReward * nodeInfo.commissionRate / 1e4) * nodeDailyActive[node][dateIndex];
            nodeInfo.selfTotalRewards += int256(commissionReward);
            nodeInfo.delegationRewards += unitReward - commissionReward;
        }

        nodeInfo.lastConfirmDate = today-1;
    }

    function _checkAttestation(Attestation memory attestation) internal view {
        require(attestation.reporter != address(0), "Attestation not exist");
        require(attestation.deadline > block.timestamp, "Deadline passed");
        require(attestation.vrfChosenID > 0, "Waiting vrf");
    }

    function _checkSignature(
        uint256 expiredAt, bytes32 hashStruct, address signer, uint8 v, bytes32 r, bytes32 s
    ) internal view {
        require(expiredAt >= block.timestamp, "Expired");
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", EIP712_DOMAIN_HASH, hashStruct)
        );
        require(signer == ecrecover(digest, v, r, s), "signer not match");
    }

    function _checkNodeInfos(bytes32 attestationID, address node, uint16 index) internal view {
        Attestation memory attestation = attestations[attestationID];
        require(nodeInfos[node].active, "Not active");
        require(delegationWeights[node] > 0, "No weights");
        require(!attestationVerifiedNode[attestationID][node], "Already verify");
        require(vrfChosenMap[attestation.vrfChosenID][index] == nodeInfos[node].id, "Not chosen");
    }

    /*----------------------------------------- modifiers --------------------------------------------*/

    modifier onlyNftOwner(uint256 tokenID) {
        require(IERC721(carvNft).ownerOf(tokenID) == msg.sender, "Not owner");
        _;
    }

    modifier onlyCarvVrf() {
        require(carvVrf == msg.sender, "Not carv vrf");
        _;
    }
}
