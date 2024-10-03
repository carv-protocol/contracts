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
    mapping(uint16 => DurationInfo) public specialDurations;

    event UpdateSettings(SettingParams params);
    event ModifySupportedDurations(uint16 duration, bool activate, uint32 rewardWeight, uint32 stakingMultiplier);
    event ModifySpecialDurations(uint16 duration, bool activate, uint32 rewardWeight, uint32 stakingMultiplier);
    event ModifyAdmin(address newAdmin);

    modifier onlyAdmin() {
        require(admin == msg.sender, "Not admin");
        _;
    }

    function __Settings_init(address initialAdmin) internal onlyInitializing {
        admin = initialAdmin;
        _modifySupportedDurations(30, true, 421500, 2500);
        _modifySupportedDurations(90, true, 1411500, 7500);
        _modifySupportedDurations(180, true, 3025500, 15000);
        _modifySupportedDurations(360, true, 6485300, 30000);
        _modifySupportedDurations(720, true, 13901600, 60000);
        _modifySupportedDurations(1080, true, 21715300, 90000);
    }

    function updateSettings(SettingParams calldata params) external onlyAdmin {
        rewardPerSecond = params.rewardPerSecond;
        minStakingAmount = params.minStakingAmount;
        emit UpdateSettings(params);
    }

    function modifySupportedDurations(
        uint16 duration, bool activate, uint32 rewardWeight, uint32 stakingMultiplier
    ) external onlyAdmin {
        _modifySupportedDurations(duration, activate, rewardWeight, stakingMultiplier);
    }

    function modifySpecialDurations(
        uint16 duration, bool activate, uint32 rewardWeight, uint32 stakingMultiplier
    ) external onlyAdmin {
        _modifySpecialDurations(duration, activate, rewardWeight, stakingMultiplier);
    }

    function modifyAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
        emit ModifyAdmin(newAdmin);
    }

    function _modifySupportedDurations(
        uint16 duration, bool activate, uint32 rewardWeight, uint32 stakingMultiplier
    ) internal {
        supportedDurations[duration] = DurationInfo(activate, rewardWeight, stakingMultiplier);
        emit ModifySupportedDurations(duration, activate, rewardWeight, stakingMultiplier);
    }

    function _modifySpecialDurations(
        uint16 duration, bool activate, uint32 rewardWeight, uint32 stakingMultiplier
    ) internal {
        specialDurations[duration] = DurationInfo(activate, rewardWeight, stakingMultiplier);
        emit ModifySpecialDurations(duration, activate, rewardWeight, stakingMultiplier);
    }
}

