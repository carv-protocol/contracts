// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISettings.sol";

contract Settings is ISettings, Ownable {

    uint256 public override maxVrfActiveNodes;
    uint256 public override nodeMinOnlineDuration;
    uint256 public override nodeVerifyDuration;
    uint256 public override nodeSlashReward;
    uint256 public override minCommissionRateModifyInterval;
    uint64 public override nodeMaxMissVerifyCount;
    uint32 public override maxCommissionRate;
    uint16 public override maxNodeWeights;

    constructor () Ownable(msg.sender) {}

    function updateSettings(SettingParams calldata params) external onlyOwner {
        _update(params);
    }

    function _update(SettingParams calldata params) internal {
        maxVrfActiveNodes = params.maxVrfActiveNodes;
        nodeMinOnlineDuration = params.nodeMinOnlineDuration;
        nodeVerifyDuration = params.nodeVerifyDuration;
        nodeSlashReward = params.nodeSlashReward;
        minCommissionRateModifyInterval = params.minCommissionRateModifyInterval;
        nodeMaxMissVerifyCount = params.nodeMaxMissVerifyCount;
        maxCommissionRate = params.maxCommissionRate;
        maxNodeWeights = params.maxNodeWeights;

        emit UpdateSettings(params);
    }
}
