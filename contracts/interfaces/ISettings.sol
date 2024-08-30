// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

interface ISettings {
    /**
     * @notice This struct represents information of all settings
     *
     * `maxVrfActiveNodes`: The maximum number of active nodes allowed,
     *                      VRF will select nodes to report verification for each attestation from these nodes.
     * `nodeMinOnlineDuration`: The daily online time needs to be greater than `nodeMinOnlineDuration` to be profitable.
     * `nodeVerifyDuration`: After the node is selected by vrf, it needs to report verification within this duration.
     * `nodeSlashReward`: After the verifier node is slashed, the reward the transaction sender can obtain.
     * `nodeMaxMissVerifyCount`: The maximum number of times a verifier node can miss verifications.
     *                           If it exceeds the limit, it will be forced exit.
     * `minCommissionRateModifyInterval`: The minimum time interval for verifier to modify commission rate
     * `maxCommissionRate`: The maximum rate of commission(decimals: 4)
     * `maxNodeWeights`: The maximum number of delegators a verifier node can have.
     */
    struct SettingParams {
        uint256 maxVrfActiveNodes;
        uint256 nodeMinOnlineDuration;
        uint256 nodeVerifyDuration;
        uint256 nodeSlashReward;
        uint256 minCommissionRateModifyInterval;
        uint64 nodeMaxMissVerifyCount;
        uint32 maxCommissionRate;
        uint16 maxNodeWeights;
    }

    event UpdateSettings(SettingParams params);

    /**
     * @notice update settings of contract.
     *
     * @dev Only owner of the contract.
     * @dev Emits `UpdateSettings`.
     */
    function updateSettings(SettingParams calldata params) external;

    function maxVrfActiveNodes() external view returns (uint256);
    function nodeMinOnlineDuration() external view returns (uint256);
    function nodeVerifyDuration() external view returns (uint256);
    function nodeSlashReward() external view returns (uint256);
    function minCommissionRateModifyInterval() external view returns (uint256);
    function nodeMaxMissVerifyCount() external view returns (uint64);
    function maxCommissionRate() external view returns (uint32);
    function maxNodeWeights() external view returns (uint16);
}
