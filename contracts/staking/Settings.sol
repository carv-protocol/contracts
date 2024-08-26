// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Settings is Initializable {

    struct SettingParams {
        uint256 rewardPerSecond;
        uint256 minStakingAmount;
    }

    struct DurationInfo {
        bool active;
        uint32 rewardWeight; // decimals 10000
        uint32 stakingMultiplier; // decimals 10000
    }

    uint32 public constant DURATION_INFO_DECIMALS = 10000;
    address public admin;
    uint256 public rewardPerSecond;
    uint256 public minStakingAmount;

    // Users' depositing duration can only be within a limited range
    mapping(uint16 => DurationInfo) public supportedDurations;

    event UpdateSettings(SettingParams params);
    event ModifyAdmin(address newAdmin);

    modifier onlyAdmin() {
        require(admin == msg.sender, "Not admin");
        _;
    }

    function __Settings_init(address initialAdmin) internal onlyInitializing {
        admin = initialAdmin;
        supportedDurations[30] = DurationInfo(true, 2500, 2500);
        supportedDurations[90] = DurationInfo(true, 7500, 7500);
        supportedDurations[180] = DurationInfo(true, 15000, 15000);
        supportedDurations[360] = DurationInfo(true, 30000, 30000);
        supportedDurations[720] = DurationInfo(true, 60000, 60000);
        supportedDurations[1080] = DurationInfo(true, 90000, 90000);
    }

    function updateSettings(SettingParams calldata params) external onlyAdmin {
        rewardPerSecond = params.rewardPerSecond;
        minStakingAmount = params.minStakingAmount;
        emit UpdateSettings(params);
    }

    function modifySupportedDurations(
        uint16 duration, bool activate, uint32 rewardWeight, uint32 stakingMultiplier
    ) external onlyAdmin {
        supportedDurations[duration] = DurationInfo(activate, rewardWeight, stakingMultiplier);
    }

    function modifyAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
        emit ModifyAdmin(newAdmin);
    }
}

