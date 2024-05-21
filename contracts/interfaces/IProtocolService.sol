// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface IProtocolService {

    enum AttestationResult {
        Valid,
        Invalid,
        Malicious
    }

    /**
     * @notice This struct represents information of a node
     *
     * `id`: The globally unique ID of the node. The node is automatically registered when
     *        it calls `nodeEnter` for the first time. Up to 65535 nodes can be registered.
     * `listIndex`: The position of the node in the current `activeVrfNodeList`
     * `active`: Is the node active?
     * `lastConfirmDate`: The date on which reward was last confirmed.
     * `missedVerifyCount`: The number of verifications the node currently misses
     * `selfTotalRewards`: The total rewards of the node itself
     * `selfClaimedRewards`: The rewards claimed by the node itself
     * `delegationRewards`: The rewards of the node’s delegator
     * `lastEnterTime`: The time when the node last called `nodeEnter` to go online
     */
    struct NodeInfo {
        uint16 id;
        uint16 listIndex;
        bool active;
        uint32 lastConfirmDate;
        uint64 missedVerifyCount;
        int256 selfTotalRewards;
        uint256 selfClaimedRewards;
        uint256 delegationRewards;
        uint256 lastEnterTime;
    }

    /**
     * @notice This struct represents reward information of a CarvNft token
     *
     * `initialRewards`: When this tokenID is delegated to a node, the initial amount of delegator's rewards needs to be recorded.
     * `totalRewards`: The amount of rewards this tokenID has been confirmed
     * `claimedRewards`: The amount of rewards this tokenID has been claimed
     */
    struct TokenRewardInfo {
        uint256 initialRewards;
        uint256 totalRewards;
        uint256 claimedRewards;
    }

    /**
     * @notice This struct represents staking information of a tee
     *
     * `valid`: Whether tee is currently valid, invalid tee cannot report attestation
     * `staked`: tee’s current staked amount
     * `lastReportAt`: The time when tee last reported attestation, used for unstake check
     */
    struct TeeStakeInfo {
        bool valid;
        uint256 staked;
        uint256 lastReportAt;
    }

    /**
     * @notice This struct represents information of an attestation
     *
     * `reporter`: The address of the tee who reported this attestation
     * `valid`: The number of votes that this attestation is considered valid (voted by the verifier node)
     * `invalid`: The number of votes that this attestation is considered invalid (voted by the verifier node)
     * `slashed`: Has this attestation been slashed?
     * `deadline`: Deadline for collecting verification
     * `requestID`: request ID of chainlink VRF
     * `vrfChosen`: The currently randomly selected verification nodes
     * `verifiedNode`: Records whether a node has reported verification
     */
    struct Attestation {
        address reporter;
        uint16 valid;
        uint16 invalid;
        uint16 malicious;
        bool slashed;
        uint256 deadline;
        uint256 requestID;
        uint16[] vrfChosen;
        mapping(address => bool) verifiedNode;
    }

    struct VrfConfigData {
        bytes32 keyHash;
        uint256 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        bool nativePayment;
    }

    // admin
    event UpdateVrfConfig(VrfConfigData config);

    // tee
    event TeeStake(address tee, uint256 amount);
    event TeeUnstake(address tee, uint256 amount);
    event TeeSlash(address tee, bytes32 attestationID, uint256 amount);
    event ClaimMaliciousTeeRewards(address verifer, uint256 amount);
    event TeeReportAttestation(address tee, bytes32 attestationID, uint256 requestID, string attestation);
    event ConfirmVrfNodes(uint256 requestId, uint16[] vrfChosen, uint256 deadline);

    // node
    event NodeRegister(address node, uint16 id);
    event NodeActivate(address node);
    event NodeClear(address node);
    event NodeSlash(address node, bytes32 attestationID, uint256 rewards);
    event NodeClaim(address node, uint256 rewards);
    event NodeReportVerification(address node, bytes32 attestationID, AttestationResult result);

    // delegation
    event Delegate(uint256 tokenID, address to);
    event Redelegate(uint256 tokenID, address to);
    event Undelegate(uint256 tokenID, address to);
    event ClaimRewards(uint256 tokenID, uint256 rewards);

    /*----------------------------------------------------------------------------------------------------------------*/

    /**
     * @notice update VRF config.
     *
     * @dev Only admin role.
     * @dev Emits `UpdateVrfConfig`.
     *
     * @param config: VrfConfigData.
     */
    function updateVrfConfig(VrfConfigData calldata config) external;

    /**
     * @notice Tee needs to stake CARVs before reporting attestation,
     * @notice and CARVs will be converted to veCARVs stored in Vault.
     * @notice which will be used to slash when tee proven to be evil.
     *
     * @dev Only tee role (granted by admin role).
     * @dev Emits `TeeStake`.
     *
     * @param amount: amount of CARV tee plans to stake.
     */
    function teeStake(uint256 amount) external;

    /**
     * @notice Tee withdraws staked veCARVs, rules are as follows:
     * @notice 1. enough time has passed since the last attestation was submitted.
     * @notice 2. veCARVs that have been slashed cannot be unstaked.
     * @notice 3. unable to continue reporting attestation after unstaking.
     *
     * @dev Only tee role (granted by admin role).
     * @dev Emits `TeeUnstake`.
     */
    function teeUnstake() external;

    /**
     * @notice When the attestation reported by a tee is proven to be malicious,
     * @notice anyone can initiate a teeSlash, which will slash the veCARVs staked by the tee.
     * @notice Each malicious attestation can only be slashed once.
     * @notice When the veCARVs staked by a tee are slashed below a threshold,
     * @notice the tee will be forcibly restricted from continuing to report attestation.
     *
     * @dev Emits `TeeSlash`.
     *
     * @param tee: address of tee which is proven malicious.
     * @param attestationID: id of attestation which is proven malicious.
     */
    function teeSlash(address tee, bytes32 attestationID) external;

    /**
     * @notice When an attestation reported by a tee is slashed,
     * @notice verifiers that have reported verification for this attestation can claim the reward.
     * @notice If a verifier have not reported verification of this attestation, it cannot claim the reward.
     *
     * @dev Emits `ClaimMaliciousTeeRewards`.
     *
     * @param attestationID: id of attestation which is slashed.
     */
    function claimMaliciousTeeRewards(bytes32 attestationID) external;

    /**
     * @notice Tee reports attestation. The same attestation can only be reported once.
     *
     * @dev Only staked tee role.
     * @dev Emits `TeeReportAttestation`.
     * @dev A request to apply for VRF will be sent to chainlink.
     * @dev After receiving the callback from chainlink, emits `ConfirmVrfNodes`.
     *
     * @param attestation: attestation to be reported.
     */
    function teeReportAttestation(string memory attestation) external;

    /**
     * @notice In order to save costs more efficiently when selecting nodes in VRF,
     * @notice we designed a data structure `activeVrfNodeList` for this purpose.
     * @notice `activeVrfNodeList` stores the top 1000 active nodes with delegation weight,
     * @notice and each time VRF will select from these nodes.
     *
     * @notice Nodes need to activate themselves by calling nodeEnter of the smart contract
     * @notice To successfully activate a node, caller need to meet the following conditions:
     * @notice 1. The caller needs to hold CarvNft, or be delegated by other holders
     * @notice 2. If the current `activeVrfNodeList` is full, you need to choose a node
     * @notice    in the list with less delegation weight than yourself to replace it.
     *
     * @dev Emits `NodeActivate`.
     * @dev If any node is kicked and replaced by your node. Emits `NodeClear`.
     * @dev If any node calls nodeEnter for the first time. Emits `NodeRegister`.
     *
     * @param replaced: address of the node that needs to be replaced by your node
     *                  only works when the `activeVrfNodeList` is full
     */
    function nodeEnter(address replaced) external;

    /**
     * @notice Exits by node itself, and verification cannot be reported after exiting.
     * @notice When a node exits, it will be punished based on missing counts during the online period.
     *
     * @dev Emits `NodeClear`.
     */
    function nodeExit() external;

    /**
     * @notice Claim reward of node.
     * @notice The reward for reporting verifications is divided into two parts: node's reward and delegators' reward
     * @notice Only when the node is online for more than 6 hours will there be reward.
     *
     * @notice Assume that a node `enter` at time t0 and `exit` at time t1.
     * @notice During the online period, it is selected by VRF s0 times and misses verification s1 times.
     * @notice The income is (t1-t0)*(1-s1*k/s0), where K is the penalty coefficient (k>1).
     *
     * @dev Emits `NodeClaim`.
     */
    function nodeClaim() external;

    /**
     * @notice Anyone can initiate a slash for a miss reporting of a node.
     * @notice Each miss reporting of a node can only be slashed once.
     * @notice When a node is selected by VRF but fails to report a verification within the specified time,
     * @notice the node can be slashed.
     *
     * @dev Emits `NodeSlash`.
     *
     * @param node: address of node to be slashed
     * @param attestationID: id of attestation that node miss reporting
     */
    function nodeSlash(address node, bytes32 attestationID, uint16 index) external;

    /**
     * @notice After an attestation is reported, a group of nodes will be randomly selected through chainlink's VRF.
     * @notice These nodes need to submit the verification within the specified time.
     * @notice When a node is selected by VRF, the proof is submitted by calling `nodeReportVerification`.
     * @notice The verification cannot be submitted repeatedly.
     *
     * @dev Only nodes chosen by VRF in this attestation.
     * @dev Emits `NodeReportVerification`.
     *
     * @param attestationID: id of attestation
     * @param result: Whether the attestation is valid after being checked by the node.
     */
    function nodeReportVerification(bytes32 attestationID, uint16 index, AttestationResult result) external;

    /**
     * @notice If the node is online but hasn't reported verification that day,
     * @notice the smart contract needs to be notified through this function to update the status of the node today.
     */
    function nodeReportDailyActive() external;

    /**
     * @notice If the NFT holder doesn't want to run the node to report the verification himself,
     * @notice he can delegate the authority to others to run by calling `delegate`.
     * @notice After delegating, NFT holders will give a proportion of rewards (10%) to the delegatee.
     *
     * @dev Emits `Delegate`.
     *
     * @param tokenID: tokenID of CarvNft to be delegated.
     * @param to: address of whom you want to delegate to
     */
    function delegate(uint256 tokenID, address to) external;

    /**
     * @notice Specify a new delegatee to replace the current delegatee.
     * @notice During the `redelegate`, the node may be triggered to exit.
     *
     * @dev Emits `Redelegate`.
     * @dev When the node's delegation weight is reduced to 0, it will be forced offline. Emits `NodeClear`
     *
     * @param tokenID: tokenID of CarvNft to be redelegated.
     * @param to: address of whom you want to redelegate to
     */
    function redelegate(uint256 tokenID, address to) external;

    /**
     * @notice Cancel current delegation.
     * @notice During the `undelegate`, the node may be triggered to exit.
     *
     * @dev Emits `undelegate`.
     * @dev When the node's delegation weight is reduced to 0, it will be forced offline. Emits `NodeClear`
     *
     * @param tokenID: tokenID of CarvNft to be undelegated.
     */
    function undelegate(uint256 tokenID) external;

    /**
     * @notice Claim rewards corresponding to a certain tokenID owned by you.
     * @notice vault.rewardsWithdraw() will be called to transfer veCARV to the user.
     * @notice After the user claim the reward, this CarvNft cannot be redeemed.
     *
     * @dev Emits `ClaimRewards`.
     *
     * @param tokenID: The token ID that needs to be claimed rewards
     */
    function claimRewards(uint256 tokenID) external;

    /**
     * @notice Check whether this tokenID has already claimed rewards.
     *
     * @param tokenID: token ID
     * @return claimed: whether this tokenID has already claimed rewards
     */
    function checkClaimed(uint256 tokenID) external view returns (bool);
}
