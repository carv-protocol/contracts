// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

interface IProtocolService {

    /**
     * @notice This enum represents result of an attestation reported by verifier
     *
     * `Valid`: This attestation can be parsed successfully and is not malicious
     * `Invalid`: This attestation cannot be parsed successfully
     * `Malicious`: This attestation can be parsed successfully but is malicious
     */
    enum AttestationResult {
        Valid,
        Invalid,
        Malicious
    }

    /**
     * @notice This struct represents information of a node
     *
     * `id`: The globally unique ID of the node. The node is automatically registered when
     *        it calls `nodeEnter` for the first time. Up to 4294967295 nodes can be registered.
     * `listIndex`: The position of the node in the current `activeVrfNodeList`
     * `active`: Is the node active?
     * `lastConfirmDate`: The date on which reward was last confirmed.
     * `missedVerifyCount`: The number of verifications the node currently misses
     * `selfTotalRewards`: The total rewards of the node itself
     * `selfClaimedRewards`: The rewards claimed by the node itself
     * `delegationRewards`: The rewards of the node’s delegator
     * `lastEnterTime`: The time when the node last called `nodeEnter` to go online
     * `commissionRate`: rate of commission, which is given by NFT holders to the verifier node.(decimals: 4)
     * `commissionRateLastModifyAt`: timestamp of last modifying commission rate
     */
    struct NodeInfo {
        uint32 id;
        uint32 listIndex;
        bool active;
        uint32 lastConfirmDate;
        uint64 missedVerifyCount;
        uint256 selfTotalRewards;
        uint256 selfClaimedRewards;
        uint256 delegationRewards;
        uint256 lastEnterTime;
        address claimer;
        uint32 commissionRate; // decimals: 4
        uint256 commissionRateLastModifyAt;
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
     * @notice This struct represents information of an attestation
     *
     * `reporter`: The address of the tee who reported this attestation
     * `valid`: The number of votes that this attestation is considered valid (voted by the verifier node)
     * `invalid`: The number of votes that this attestation is considered invalid (voted by the verifier node)
     * `vrfChosenID`: ID of the currently randomly selected verification nodes
     * `slashed`: Has this attestation been slashed?
     * `deadline`: Deadline for collecting verification
     */
    struct Attestation {
        address reporter;
        uint16 valid;
        uint16 invalid;
        uint16 malicious;
        uint32 vrfChosenID;
        uint256 deadline;
    }

    /**
     * @notice This struct represents information of an verification with signature
     *
     * `result`: result of this attestation
     * `index`: index of this node in activeVrfNodeList
     * `signer`: address of this node (sign the Data to call contract gasless)
     * `v`: v of signature signed by signer
     * `r`: r of signature signed by signer
     * `s`: s of signature signed by signer
     */
    struct VerificationInfo {
        AttestationResult result;
        uint32 index;
        address signer;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // admin
    event UpdateVrfAddress(address vrf);
    event UpdateSettingsAddress(address settings);

    // tee
    event TeeReportAttestations(address tee, bytes32[] attestationIDs, string[] attestationInfos, uint256 requestID);
    event ConfirmVrfNodes(uint256 requestId, uint32[] vrfChosen, uint256 deadline);

    // node
    event NodeRegister(address node, uint32 id);
    event NodeActivate(address node, uint32 listIndex);
    event NodeClear(address node);
    event NodeSlash(address slasher, address node, bytes32 attestationID, uint256 rewards);
    event NodeModifyCommissionRate(address node, uint32 commissionRate);
    event NodeSetClaimer(address node, address claimer);
    event NodeClaim(address node, address claimer, uint256 rewards);
    event NodeReportVerification(address node, bytes32 attestationID, AttestationResult result);
    event NodeReportVerificationBatch(bytes32 attestationID, VerificationInfo[] infos);
    event NodeDailyActive(address node, uint32 date);
    event NodeConfirmReward(address node, uint256 selfReward, uint256 delegationReward);

    // delegation
    event Delegate(uint256 tokenID, address to);
    event Redelegate(uint256 tokenID, address to);
    event Undelegate(uint256 tokenID, address to);
    event ClaimRewards(uint256 tokenID, address claimer, uint256 rewards);

    /*----------------------------------------------------------------------------------------------------------------*/

    /**
     * @notice update address of Settings contract.
     *
     * @dev Only admin role.
     * @dev Emits `UpdateSettingsAddress`.
     *
     * @param settings_: address of Settings contract.
     */
    function updateSettingsAddress(address settings_) external;
    /**
     * @notice update address of CarvVrf contract.
     *
     * @dev Only admin role.
     * @dev Emits `UpdateVrfAddress`.
     *
     * @param carvVrf_: address of CarvVrf contract.
     */
    function updateVrfAddress(address carvVrf_) external;

    /**
     * @notice Tee reports attestations. The same attestation can only be reported once.
     *
     * @dev Only staked tee role.
     * @dev Emits `TeeReportAttestations`.
     * @dev A request to apply for VRF will be sent to chainlink.
     * @dev After receiving the callback from chainlink, emits `ConfirmVrfNodes`.
     *
     * @param attestationInfos: attestations to be reported.
     */
    function teeReportAttestations(string[] memory attestationInfos) external;

    /**
     * @notice In order to save costs more efficiently when selecting nodes in VRF,
     * @notice we designed a data structure `activeVrfNodeList` for this purpose.
     * @notice `activeVrfNodeList` stores up to 2000 active nodes with delegation weight,
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
     * @param replacedNode: address of the node that needs to be replaced by your node
     *                  only works when the `activeVrfNodeList` is full
     */
    function nodeEnter(address replacedNode) external;

    /**
     * @notice Exits by node itself, and verification cannot be reported after exiting.
     * @notice When a node exits, it will be punished based on missing counts during the online period.
     *
     * @dev Emits `NodeClear`.
     */
    function nodeExit() external;

    /**
     * @notice Modify the commission rate of verifier node
     *
     * @dev Emits `NodeModifyCommissionRate`.
     *
     * @param commissionRate: rate of commission, which is given by NFT holders to the verifier node
     */
    function nodeModifyCommissionRate(uint32 commissionRate) external;

    /**
     * @notice Similar to `nodeEnter`,
     * @notice but the txn can be broadcast to the chain by other address after being authenticated by the node.
     * @notice Compared with the `nodeEnter`, it is gasless for the verifier node.
     * @notice following the eip-712.
     *
     * @dev Emits `NodeActivate`.
     * @dev If any node is kicked and replaced by your node. Emits `NodeClear`.
     * @dev If any node calls nodeEnter for the first time. Emits `NodeRegister`.
     *
     * @param replacedNode: address of the node that needs to be replaced by your node
     *                  only works when the `activeVrfNodeList` is full
     * @param expiredAt: transaction expiration time
     * @param signer: address of verifier node ready to enter
     */
    function nodeEnterWithSignature(
        address replacedNode, uint256 expiredAt, address signer, uint8 v, bytes32 r, bytes32 s
    ) external;

    /**
     * @notice Similar to `nodeExit`,
     * @notice but the txn can be broadcast to the chain by other address after being authenticated by the node.
     * @notice Compared with the `nodeExit`, it is gasless for the verifier node.
     * @notice following the eip-712.
     *
     * @dev Emits `NodeClear`.
     *
     * @param expiredAt: transaction expiration time
     * @param signer: address of verifier node ready to exit
     */
    function nodeExitWithSignature(
        uint256 expiredAt, address signer, uint8 v, bytes32 r, bytes32 s
    ) external;

    /**
     * @notice Similar to `nodeModifyCommissionRate`,
     * @notice but the txn can be broadcast to the chain by other address after being authenticated by the node.
     * @notice Compared with the `nodeModifyCommissionRate`, it is gasless for the verifier node.
     * @notice following the eip-712.
     *
     * @dev Emits `NodeModifyCommissionRate`.
     *
     * @param commissionRate: rate of commission, which is given by NFT holders to the verifier node
     * @param expiredAt: transaction expiration time
     * @param signer: address of verifier node
     */
    function nodeModifyCommissionRateWithSignature(
        uint32 commissionRate, uint256 expiredAt, address signer, uint8 v, bytes32 r, bytes32 s
    ) external;

    /**
     * @notice Specify the address that can claim rewards of this verifier node
     * @notice it is gasless for the verifier node.
     * @notice following the eip-712.
     *
     * @dev Emits `NodeSetClaimer`.
     *
     * @param claimer: address of whom can claim reward of this verifier
     * @param expiredAt: transaction expiration time
     * @param signer: address of verifier node
     */
    function nodeSetRewardClaimerWithSignature(
        address claimer, uint256 expiredAt, address signer, uint8 v, bytes32 r, bytes32 s
    ) external;

    /**
     * @notice Claim reward of node.
     * @notice The reward for reporting verifications is divided into two parts: node's reward and delegators' reward
     * @notice Only when the node is online for more than 6 hours/day will there be reward.
     *
     * @dev Emits `NodeClaim`.
     *
     * @param node: address of node to claim reward
     */
    function nodeClaim(address node) external;

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
     * @param index: index of this node in vrfChosen list of this attestation
     */
    function nodeSlash(address node, bytes32 attestationID, uint32 index) external;

    /**
     * @notice If the node is online but hasn't reported verification that day,
     * @notice the smart contract needs to be notified through this function to update the status of the node today.
     *
     * @param node: address of the node to report daily active
     */
    function nodeReportDailyActive(address node) external;

    /**
     * @notice Confirm the node reward,
     * @notice the smart contract needs to be notified through this function to update the reward of the node before today.
     *
     * @param node: address of the node to confirm rewards
     */
    function confirmNodeRewards(address node) external;

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
     * @param index: index of this node in vrfChosen list of this attestation
     * @param result: Whether the attestation is valid after being checked by the node.
     */
    function nodeReportVerification(bytes32 attestationID, uint32 index, AttestationResult result) external;

    /**
     * @notice Batch reporting verification.
     * @notice One address can collect multiple verifications and delegate reporting them in batches,
     * @notice following the eip-712.
     *
     * @dev Emits `NodeReportVerificationBatch`.
     */
    function nodeReportVerificationBatch(bytes32 attestationID, VerificationInfo[] calldata infos) external;

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

    /**
     * @notice Get the index of today.
     */
    function todayIndex() external view returns (uint32);

    /**
     * @notice Get the offset of today.
     */
    function todayOffset() external view returns (uint256);
}
