// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IProtocolService.sol";
import "./interfaces/IVault.sol";

contract ProtocolService is IProtocolService, AccessControlUpgradeable, VRFConsumerBaseV2Plus {
    using SafeERC20 for IERC20;

    bytes32 public constant TEE_ROLE = keccak256("TEE_ROLE");
    uint256 public constant MAX_VRF_ACTIVE_NODES = 2000;
    uint256 public constant NODE_MIN_ONLINE_DURATION = 6 hours;
    uint256 public constant NODE_VERIFY_DURATION = 30 minutes;
    uint256 public constant MIN_TEE_STAKE_AMOUNT = 1e6 * 1e18;
    uint256 public constant TEE_SLASH_AMOUNT = 1e3 * 1e18;
    uint256 public constant TEE_UNSTAKE_DURATION = 6 hours;
    uint256 public constant UNIT_REWARDS = 10;
    uint64 public constant NODE_MAX_MISS_VERIFY_COUNT = 5;
    uint32 public constant VRF_NUM_WORDS = 1;
    uint16 public constant MAX_NODE_WEIGHTS = 100; // todo can be configured by admin (consider a config contract)
    uint16 public constant MAX_UINT16 = 65535; // type(uint16).max;

    VrfConfigData public vrfConfig;

    address public vault;
    address public carvToken;
    address public carvNft;

    uint16 nodeIndex;
    uint16[] public activeVrfNodeList;

    mapping(uint16 => address) nodeAddrByID;
    mapping(uint256 => address) public delegation;
    mapping(address => uint16) public delegationWeights;
    mapping(address => NodeInfo) public nodeInfos;
    mapping(uint256 => TokenRewardInfo) public tokenRewardInfos;
    mapping(address => TeeStakeInfo) public teeStakeInfos;
    mapping(bytes32 => Attestation) public attestations;
    mapping(uint256 => bytes32) public request2Attestation;
    mapping(address => mapping(bytes32 => bool)) nodeSlashed;

    constructor(address carvToken_, address carvNft_, address vault_, address vrf_) VRFConsumerBaseV2Plus(vrf_) {
        carvToken = carvToken_;
        carvNft = carvNft_;
        vault= vault_;
    }

    function initialize() public initializer {
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function updateVrfConfig(VrfConfigData calldata config) external onlyRole(DEFAULT_ADMIN_ROLE) {
        vrfConfig = config;
        emit UpdateVrfConfig(config);
    }

    function teeStake(uint256 amount) external onlyRole(TEE_ROLE) {
        require(amount >= MIN_TEE_STAKE_AMOUNT, "Not meet min");
        require(!teeStakeInfos[msg.sender].valid, "Invalid");
        IERC20(carvToken).transferFrom(msg.sender, address(this), amount);
        teeStakeInfos[msg.sender] = TeeStakeInfo(true, amount, 0);

        emit TeeStake(msg.sender, amount);
    }

    function teeUnstake() external onlyRole(TEE_ROLE) {
        TeeStakeInfo storage info = teeStakeInfos[msg.sender];
        require(
            block.timestamp - info.lastReportAt >= TEE_UNSTAKE_DURATION,
            "duration"
        );

        uint256 amount = info.staked;
        info.valid = false;
        info.staked = 0;

        IERC20(carvToken).transfer(msg.sender, amount);
        emit TeeUnstake(msg.sender, amount);
    }

    function teeSlash(address tee, bytes32 attestationID) external {
        Attestation storage attestation = attestations[attestationID];
        require(attestation.reporter == tee, "reporter");
        require(!attestation.slashed, "already slashed");
        require(attestation.deadline < block.timestamp, "deadline");
        require(attestation.valid < attestation.malicious, "valid attestation");
        TeeStakeInfo storage info = teeStakeInfos[tee];
        require(info.valid, "invalid tee");

        info.staked -= TEE_SLASH_AMOUNT;
        if (info.staked < TEE_SLASH_AMOUNT) {
            info.valid = false;
        }
        attestation.slashed = true;

        // TODO how to distribute slash tokens
        IERC20(carvToken).transfer(msg.sender, TEE_SLASH_AMOUNT);
        emit TeeSlash(tee, attestationID, TEE_SLASH_AMOUNT);
    }

    function teeReportAttestation(string memory attestation) external onlyRole(TEE_ROLE) {
        TeeStakeInfo storage tee = teeStakeInfos[msg.sender];
        require(tee.valid, "invalid");

        bytes32 attestationID = keccak256(bytes(attestation));
        require(attestations[attestationID].reporter == address(0), "already reported");

        // request Random Number (chainlink vrf)
        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: vrfConfig.keyHash,
                subId: vrfConfig.subId,
                requestConfirmations: vrfConfig.requestConfirmations,
                callbackGasLimit: vrfConfig.callbackGasLimit,
                numWords: VRF_NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: vrfConfig.nativePayment}))
            })
        );
        request2Attestation[requestId] = attestationID;

        Attestation storage attestationInfo = attestations[attestationID];
        attestationInfo.reporter = msg.sender;
        attestationInfo.requestID = requestId;
        tee.lastReportAt = block.timestamp;

        emit TeeReportAttestation(msg.sender, attestationID, requestId, attestation);
    }

    function nodeEnter(address replacedNode) external {
        address node = msg.sender;
        require(delegationWeights[node] > 0, "no weights");

        if (nodeInfos[node].id == 0) {
            _nodeRegister(node);
        }

        NodeInfo memory info = nodeInfos[node];
        require(!info.active, "already enter");

        if (activeVrfNodeList.length < MAX_VRF_ACTIVE_NODES) {
            activeVrfNodeList.push(info.id);
            _nodeActivate(node, uint16(activeVrfNodeList.length)-1);
            return;
        }

        require(delegationWeights[node] > delegationWeights[replacedNode], "less weights");
        NodeInfo storage replacedNodeInfo = nodeInfos[replacedNode];
        activeVrfNodeList[replacedNodeInfo.listIndex] = info.id;
        _nodeActivate(node, replacedNodeInfo.listIndex);
        _nodeClear(replacedNode);
    }

    function nodeExit() external {
        require(nodeInfos[msg.sender].active, "already exit");
        _nodeExit(msg.sender);
    }

    function nodeClaim() external {
        NodeInfo storage nodeInfo = nodeInfos[msg.sender];
        require(nodeInfo.id > 0, "not register");

        if (
            nodeInfo.active &&
            (block.timestamp - nodeInfo.lastEnterTime >= NODE_MIN_ONLINE_DURATION) &&
            (nodeInfo.pendingVerifyCount > nodeInfo.missedVerifyCount)
        ) {
            nodeInfo.confirmedVerifyCount += nodeInfo.pendingVerifyCount - nodeInfo.missedVerifyCount;
            nodeInfo.pendingVerifyCount = 0;
            nodeInfo.missedVerifyCount = 0;
        }

        require(nodeInfo.confirmedVerifyCount > nodeInfo.claimedVerifyCount, "no rewards");
        uint256 rewards = UNIT_REWARDS * (nodeInfo.confirmedVerifyCount - nodeInfo.claimedVerifyCount);
        nodeInfo.claimedVerifyCount = nodeInfo.confirmedVerifyCount;

        IVault(vault).rewardsWithdraw(msg.sender, rewards);

        emit NodeClaim(msg.sender, rewards);
    }

    function nodeSlash(address node, bytes32 attestationID, uint16 index) external {
        Attestation storage attestation = attestations[attestationID];
        require(attestation.deadline > block.timestamp, "deadline");

        NodeInfo storage nodeInfo = nodeInfos[node];
        require(!nodeSlashed[node][attestationID], "already slashed");
        require(nodeInfo.active, "node exit");
        require(_checkNodeChosen(nodeInfo.id, attestation.vrfChosen, index), "not chosen");
        require(!attestation.verifiedNode[node], "node verified");

        nodeInfo.missedVerifyCount += 1;
        nodeSlashed[node][attestationID] = true;

        if (nodeInfo.missedVerifyCount > NODE_MAX_MISS_VERIFY_COUNT) {
            // too many miss, force exit
            _nodeExit(node);
        }

        IVault(vault).rewardsWithdraw(msg.sender, UNIT_REWARDS);
        emit NodeSlash(node, attestationID, UNIT_REWARDS);
    }

    function nodeReportVerification(bytes32 attestationID, uint16 index, AttestationResult result) external {
        require(nodeInfos[msg.sender].active, "not active");
        require(delegationWeights[msg.sender] > 0, "no weights");

        Attestation storage attestation = attestations[attestationID];

        require(attestation.reporter != address(0), "attestation not exist");
        require(attestation.deadline > block.timestamp, "deadline passed");
        require(attestation.vrfChosen.length > 0, "waiting vrf");
        require(!attestation.verifiedNode[msg.sender], "already verify");

        NodeInfo storage nodeInfo = nodeInfos[msg.sender];
        require(_checkNodeChosen(nodeInfo.id, attestation.vrfChosen, index), "not chosen");

        if (result == AttestationResult.Valid) {
            attestation.valid += 1;
        } else if (result == AttestationResult.Invalid) {
            attestation.invalid += 1;
        } else if (result == AttestationResult.Malicious) {
            attestation.malicious += 1;
        } else {
            revert("Unknown AttestationResult");
        }
        attestation.verifiedNode[msg.sender] = true;
        nodeInfo.pendingVerifyCount += 1;

        emit NodeReportVerification(msg.sender, attestationID, result);
    }

    function delegate(uint256 tokenID, address to) external {
        address owner = IERC721(carvNft).ownerOf(tokenID);
        require(owner == msg.sender, "not owner");
        require(delegation[tokenID] == address(0), "alreday delegate");
        require(delegationWeights[to] < MAX_NODE_WEIGHTS, "max node weights");

        delegation[tokenID] = to;
        delegationWeights[to] += 1;

        tokenRewardInfos[tokenID].initialVerifyCount = nodeInfos[to].confirmedVerifyCount + nodeInfos[to].pendingVerifyCount - nodeInfos[to].missedVerifyCount;
        emit Delegate(tokenID, to);
    }

    function redelegate(uint256 tokenID, address to) external {
        address owner = IERC721(carvNft).ownerOf(tokenID);
        address old = delegation[tokenID];

        require(owner == msg.sender, "not owner");
        require(old != address(0), "not delegate");
        require(old != to, "redelegate to same one");
        require(delegationWeights[to] < MAX_NODE_WEIGHTS, "max node weights");

        delegation[tokenID] = to;
        delegationWeights[to] += 1;
        delegationWeights[old] -= 1;

        if (nodeInfos[old].active && delegationWeights[old] == 0) {
            _nodeExit(old);
        }

        NodeInfo memory toNodeInfo = nodeInfos[to];
        NodeInfo memory oldNodeInfo = nodeInfos[old];
        TokenRewardInfo storage rewardInfo = tokenRewardInfos[tokenID];

        rewardInfo.confirmedVerifyCount += oldNodeInfo.confirmedVerifyCount + oldNodeInfo.pendingVerifyCount - oldNodeInfo.missedVerifyCount - rewardInfo.initialVerifyCount;
        rewardInfo.initialVerifyCount = toNodeInfo.confirmedVerifyCount + toNodeInfo.pendingVerifyCount - toNodeInfo.missedVerifyCount;

        emit Redelegate(tokenID, to);
    }

    function undelegate(uint256 tokenID) external {
        address owner = IERC721(carvNft).ownerOf(tokenID);
        address old = delegation[tokenID];

        require(owner == msg.sender, "not owner");
        require(old != address(0), "not delegate");

        delegation[tokenID] = address(0);
        delegationWeights[old] -= 1;

        if (nodeInfos[old].active && delegationWeights[old] == 0) {
            _nodeExit(old);
        }

        NodeInfo memory oldNodeInfo = nodeInfos[old];
        TokenRewardInfo storage rewardInfo = tokenRewardInfos[tokenID];
        rewardInfo.confirmedVerifyCount += oldNodeInfo.confirmedVerifyCount + oldNodeInfo.pendingVerifyCount - oldNodeInfo.missedVerifyCount - rewardInfo.initialVerifyCount;

        emit Undelegate(tokenID, old);
    }

    function claimRewards(uint256 tokenID) external {
        require(IERC721(carvNft).ownerOf(tokenID) == msg.sender, "not owner");

        TokenRewardInfo storage rewardInfo = tokenRewardInfos[tokenID];

        NodeInfo memory nodeInfo = nodeInfos[delegation[tokenID]];
        uint64 currentVerifyCount = nodeInfo.confirmedVerifyCount + nodeInfo.pendingVerifyCount - nodeInfo.missedVerifyCount;
        rewardInfo.confirmedVerifyCount += currentVerifyCount - rewardInfo.initialVerifyCount;
        rewardInfo.initialVerifyCount = currentVerifyCount;

        require(rewardInfo.confirmedVerifyCount > rewardInfo.claimedVerifyCount, "no rewards");
        uint256 rewards = UNIT_REWARDS * (rewardInfo.confirmedVerifyCount - rewardInfo.claimedVerifyCount);
        rewardInfo.claimedVerifyCount = rewardInfo.confirmedVerifyCount;

        IVault(vault).rewardsWithdraw(msg.sender, rewards);

        emit ClaimRewards(tokenID, rewards);
    }

    function checkClaimed(uint256 tokenID) external view returns (bool) {
        return tokenRewardInfos[tokenID].claimedVerifyCount > 0;
    }

    // chainlink VRF callback function
    // According to random words, emit event to decide nodes verifying
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        Attestation storage attestation = attestations[request2Attestation[requestId]];
        require(attestation.reporter != address(0), "attestation not exist");
        require(randomWords.length >= VRF_NUM_WORDS, "wrong randomWords");

        attestation.deadline = block.timestamp + NODE_VERIFY_DURATION;
        attestation.vrfChosen = _vrfChooseNodes(randomWords[0]);

        emit ConfirmVrfNodes(requestId, attestation.vrfChosen, attestation.deadline);
    }

    function _nodeExit(address node) internal {
        NodeInfo memory info = nodeInfos[node];

        if (activeVrfNodeList.length - 1 == info.listIndex) {
            activeVrfNodeList.pop();
        } else {
            uint16 tailNodeId = activeVrfNodeList[activeVrfNodeList.length - 1];
            NodeInfo storage tailNodeInfo = nodeInfos[nodeAddrByID[tailNodeId]];
            activeVrfNodeList[info.listIndex] = tailNodeInfo.id;
            tailNodeInfo.listIndex = info.listIndex;
        }

        _nodeClear(node);
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

        if ( (block.timestamp - info.lastEnterTime >= NODE_MIN_ONLINE_DURATION) && (info.pendingVerifyCount > info.missedVerifyCount)) {
            info.confirmedVerifyCount += info.pendingVerifyCount - info.missedVerifyCount;
            info.pendingVerifyCount = 0;
            info.missedVerifyCount = 0;
        }

        emit NodeClear(node);
    }

    function _nodeRegister(address node) internal {
        // first enter, assign id
        require(nodeIndex < MAX_UINT16, "index overflow");
        nodeIndex++;
        NodeInfo storage nodeInfo = nodeInfos[node];
        nodeInfo.id = nodeIndex;
        nodeInfo.listIndex = MAX_UINT16;
        nodeAddrByID[nodeIndex] = node;

        emit NodeRegister(node, nodeIndex);
    }

    // if number of active nodes is less than 10, choose all active nodes
    // if number of active nodes is more than 10 and less than 100, choose 10 active nodes randomly
    // if number of active node is more than 100, choose 1/10 of active nodes randomly
    function _vrfChooseNodes(uint256 randomWord) internal view returns (uint16[] memory) {
        if (activeVrfNodeList.length <= 10) {
            return activeVrfNodeList;
        }

        uint16 startIndex = uint16(randomWord % activeVrfNodeList.length);
        uint16 length = 10;
        if (activeVrfNodeList.length > 100) {
            length = uint16(activeVrfNodeList.length/10);
        }

        uint16[] memory chosenNodes = new uint16[](length);
        for (uint16 i=0; i<length; i++) {
            chosenNodes[i] = activeVrfNodeList[startIndex];
            startIndex = (startIndex+1) % uint16(activeVrfNodeList.length);
        }

        return chosenNodes;
    }

    function _checkNodeChosen(uint16 nodeID, uint16[] memory vrfChosen, uint16 index) internal pure returns (bool) {
        return vrfChosen[index] == nodeID;
    }
}
