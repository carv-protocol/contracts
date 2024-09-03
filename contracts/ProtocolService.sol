// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IProtocolService.sol";
import "./interfaces/ICarvVrfCallback.sol";
import "./interfaces/ICarvVrf.sol";
import "./interfaces/ISettings.sol";
import "./interfaces/IVault.sol";

contract ProtocolService is IProtocolService, ICarvVrfCallback, AccessControlUpgradeable, MulticallUpgradeable {

    bytes32 public constant TEE_ROLE = keccak256("TEE_ROLE");
    bytes32 public constant SLASH_ROLE = keccak256("SLASH_ROLE");
    uint256 public constant MAX_SIGNATURE_DURATION = 6 hours;
    uint32 public constant MAX_UINT32 = 4294967295; // type(uint32).max;
    uint32 public constant CHOOSE_NODES_MAX = 200;

    bytes32 public eip712DomainHash;

    address public vault;
    address public carvToken;
    address public carvNft;
    address public settings;
    address public carvVrf;

    uint32 public nodeIndex;
    uint32[] public activeVrfNodeList;

    uint32 public vrfChosenIndex;
    mapping(uint32 => uint32[]) public vrfChosenMap;

    mapping(uint32 => address) public nodeAddrByID;
    mapping(uint256 => address) public delegation;
    mapping(address => uint16) public delegationWeights;
    mapping(address => NodeInfo) public nodeInfos;
    mapping(uint256 => TokenRewardInfo) public tokenRewardInfos;
    mapping(bytes32 => Attestation) public attestations;
    mapping(uint256 => bytes32[]) public request2AttestationIDs;
    mapping(bytes32 => mapping(address => bool)) public attestationVerifiedNode;
    mapping(address => mapping(bytes32 => bool)) public nodeSlashed;
    mapping(uint32 => uint32) public globalDailyActiveNodes;
    mapping(address => mapping(uint32 => uint32)) public nodeDailyActive;

    function initialize(
        address carvToken_, address carvNft_, address vault_, uint256 chainID
    ) public initializer {
        carvToken = carvToken_;
        carvNft = carvNft_;
        vault= vault_;
        __Multicall_init();
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        eip712DomainHash = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId)"),
                keccak256(bytes("ProtocolService")),
                keccak256(bytes("1.0.0")),
                chainID
            )
        );
    }

    function updateSettingsAddress(address settings_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        settings = settings_;
        emit UpdateSettingsAddress(settings_);
    }

    function updateVrfAddress(address carvVrf_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        carvVrf = carvVrf_;
        emit UpdateVrfAddress(carvVrf_);
    }

    function teeReportAttestations(string[] memory attestationInfos) external onlyRole(TEE_ROLE) {
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

    // chainlink VRF callback function
    // According to random words, emit event to decide nodes verifying
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external onlyCarvVrf override {
        require(randomWords.length > 0, "Wrong randomWords");

        uint256 deadline = block.timestamp + ISettings(settings).nodeVerifyDuration();
        uint32[] memory vrfChosen = _vrfChooseNodes(randomWords[0]);
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
        confirmNodeRewards(node);
        require(nodeInfo.selfTotalRewards > int256(nodeInfo.selfClaimedRewards), "No reward");

        uint256 rewards = uint256(nodeInfo.selfTotalRewards) - nodeInfo.selfClaimedRewards;
        nodeInfo.selfClaimedRewards = uint256(nodeInfo.selfTotalRewards);

        IVault(vault).rewardsWithdraw(msg.sender, rewards);
        emit NodeClaim(node, msg.sender, rewards);
    }

    function nodeSlash(address node, bytes32 attestationID, uint32 index) external onlyRole(SLASH_ROLE) {
        Attestation storage attestation = attestations[attestationID];
        require(attestation.deadline < block.timestamp, "Deadline");

        NodeInfo storage nodeInfo = nodeInfos[node];
        require(!nodeSlashed[node][attestationID], "Already slashed");
        require(vrfChosenMap[attestation.vrfChosenID][index] == nodeInfo.id, "Not chosen");
        require(!attestationVerifiedNode[attestationID][node], "Node verified");

        uint256 reward = ISettings(settings).nodeSlashReward();
        nodeInfo.missedVerifyCount += 1;
        nodeInfo.selfTotalRewards -= int256(reward);
        nodeSlashed[node][attestationID] = true;
        IVault(vault).rewardsWithdraw(msg.sender, reward);
        emit NodeSlash(msg.sender, node, attestationID, reward);

        if (nodeInfo.missedVerifyCount >= ISettings(settings).nodeMaxMissVerifyCount()) {
            // too many miss, force exit
            _nodeExit(node);
        }
    }

    function nodeReportDailyActive(address node) external {
        require(nodeInfos[node].active, "Inactive node");
        _updateNodeDailyActive(node);
    }

    function confirmNodeRewards(address node) public {
        uint32 today = todayIndex();
        NodeInfo storage nodeInfo = nodeInfos[node];

        if (nodeInfo.lastConfirmDate == today-1) {
            return;
        }

        for (uint32 dateIndex = nodeInfo.lastConfirmDate+1; dateIndex < today; dateIndex++) {
            if (globalDailyActiveNodes[dateIndex] == 0 || nodeDailyActive[node][dateIndex] == 0) {
                continue;
            }
            uint256 unitReward = IVault(vault).totalRewardByDate(dateIndex) / globalDailyActiveNodes[dateIndex];
            uint256 commissionReward = unitReward * nodeInfo.commissionRate / 1e4;
            nodeInfo.selfTotalRewards += int256(commissionReward * nodeDailyActive[node][dateIndex]);
            nodeInfo.delegationRewards += unitReward - commissionReward;
        }

        nodeInfo.lastConfirmDate = today-1;
        emit NodeConfirmReward(node, nodeInfo.selfTotalRewards, nodeInfo.delegationRewards);
    }

    function nodeReportVerification(bytes32 attestationID, uint32 index, AttestationResult result) external {
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
                        "VerificationData(bytes32 attestationID,uint8 result,uint32 index)"
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
        require(to != address(0), "Empty delegated address");
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

        emit ClaimRewards(tokenID, msg.sender, rewards);
    }

    function checkClaimed(uint256 tokenID) external view returns (bool) {
        return tokenRewardInfos[tokenID].totalRewards > 0;
    }

    function todayIndex() public view returns (uint32) {
        return uint32((block.timestamp - IVault(vault).startTimestamp()) / (1 days)) + 1;
    }

    function todayOffset() public view returns (uint256) {
        return (block.timestamp - IVault(vault).startTimestamp()) % (1 days);
    }

    /*----------------------------------------- internal functions --------------------------------------------*/
    // if number of active nodes is less than ChHOOSE NODES_MAX(200), choose all active nodeS
    // if number of active nodes is more than CHOOSE_NODES_MAX(200), choose CHOOSE_NODES_MAX(200) adctive nodes randomly
    function _vrfChooseNodes(uint256 randomWord) internal view returns (uint32[] memory) {

        if (activeVrfNodeList.length <= CHOOSE_NODES_MAX) {
            return activeVrfNodeList;
        }

        uint32[] memory chosenNodes = new uint32[](CHOOSE_NODES_MAX);
        uint32 curIndex = uint32(randomWord % activeVrfNodeList.length);

        for (uint32 i=0; i< CHOOSE_NODES_MAX; i++) {
            chosenNodes[i] = activeVrfNodeList[curIndex];
            curIndex = (curIndex+1) % uint32(activeVrfNodeList.length);
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
            _nodeActivate(node, uint32(activeVrfNodeList.length)-1);
            return;
        }

        require(delegationWeights[node] > delegationWeights[replacedNode], "Less weights");
        NodeInfo storage replacedNodeInfo = nodeInfos[replacedNode];
        require(replacedNodeInfo.active, "Replaced node is not active");
        activeVrfNodeList[replacedNodeInfo.listIndex] = nodeInfos[node].id;
        _nodeActivate(node, replacedNodeInfo.listIndex);
        _nodeClear(replacedNode);
    }

    function _nodeExit(address node) internal {
        require(nodeInfos[node].active, "Already exit");
        if (nodeInfos[node].listIndex != activeVrfNodeList.length - 1 ) {
            uint32 tailNodeId = activeVrfNodeList[activeVrfNodeList.length - 1];
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
        require(commissionRate <= ISettings(settings).maxCommissionRate(), "Value is too large");
        nodeInfo.commissionRate = commissionRate;
        nodeInfo.commissionRateLastModifyAt = block.timestamp;
        emit NodeModifyCommissionRate(node, commissionRate);
    }

    function _nodeActivate(address node, uint32 listIndex) internal {
        NodeInfo storage info = nodeInfos[node];
        info.listIndex = listIndex;
        info.active = true;
        info.lastEnterTime = block.timestamp;

        emit NodeActivate(node, listIndex);
    }

    function _nodeClear(address node) internal {
        NodeInfo storage info = nodeInfos[node];
        info.listIndex = MAX_UINT32;
        info.active = false;
        info.missedVerifyCount = 0;

        _updateNodeDailyActive(node);
        emit NodeClear(node);
    }

    function _nodeRegister(address node) internal {
        // first enter, assign id
        require(nodeIndex < MAX_UINT32, "Index overflow");
        nodeIndex++;
        NodeInfo storage nodeInfo = nodeInfos[node];
        nodeInfo.id = nodeIndex;
        nodeInfo.listIndex = MAX_UINT32;
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
            emit NodeDailyActive(node, today);
        }
    }

    function _checkAttestation(Attestation memory attestation) internal view {
        require(attestation.reporter != address(0), "Attestation not exist");
        require(attestation.deadline > block.timestamp, "Deadline passed");
        require(attestation.vrfChosenID > 0, "Waiting vrf");
    }

    function _checkSignature(
        uint256 expiredAt, bytes32 hashStruct, address signer, uint8 v, bytes32 r, bytes32 s
    ) internal view {
        require(expiredAt >= block.timestamp && expiredAt <= block.timestamp + MAX_SIGNATURE_DURATION, "Invalid expiredAt");
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", eip712DomainHash, hashStruct)
        );

        require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, "Invalid signature S");
        require(signer == ecrecover(digest, v, r, s), "signer not match");
        require(signer != address(0), "Invalid signature");
    }

    function _checkNodeInfos(bytes32 attestationID, address node, uint32 index) internal view {
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
