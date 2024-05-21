// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISettings.sol";

contract Settings is ISettings, Ownable {

    uint256 public override maxVrfActiveNodes;
    uint256 public override nodeMinOnlineDuration;
    uint256 public override nodeVerifyDuration;
    uint256 public override nodeSlashReward;
    uint256 public override minTeeStakeAmount;
    uint256 public override teeSlashAmount;
    uint256 public override teeUnstakeDuration;
    uint64 public override nodeMaxMissVerifyCount;
    uint32 public override commissionRate; // decimals: 4
    uint16 public override maxNodeWeights;

    constructor () Ownable(msg.sender) {}

    function updateSettings(SettingParams calldata params) external onlyOwner {
        _update(params);
    }

    function mulCommissionRate(uint256 value) external override view returns (uint256) {
        return value * commissionRate / 1e4;
    }

    function _update(SettingParams calldata params) internal {
        maxVrfActiveNodes = params.maxVrfActiveNodes;
        nodeMinOnlineDuration = params.nodeMinOnlineDuration;
        nodeVerifyDuration = params.nodeVerifyDuration;
        nodeSlashReward = params.nodeSlashReward;
        minTeeStakeAmount = params.minTeeStakeAmount;
        teeSlashAmount = params.teeSlashAmount;
        teeUnstakeDuration = params.teeUnstakeDuration;
        nodeMaxMissVerifyCount = params.nodeMaxMissVerifyCount;
        commissionRate = params.commissionRate;
        maxNodeWeights = params.maxNodeWeights;

        emit UpdateSettings(params);
    }
}
