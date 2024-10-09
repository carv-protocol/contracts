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

    struct SettingsStorage {
        address _admin;
        uint256 _rewardPerSecond;
        uint256 _minStakingAmount;
        // Users' depositing duration can only be within a limited range
        mapping(uint16 => DurationInfo) _supportedDurations;
        mapping(uint16 => DurationInfo) _specialDurations;
    }

    // keccak256(keccak256("carvprotocol.storage.vecarvs.settings"))
    bytes32 private constant SettingsLocation = 0x9bae22ba69080cc98246b2a592cbdde0423acc2963c9ce980cadcdd5832b89cb;
    uint32 public constant DURATION_INFO_DECIMALS = 10000;

    function _getSettingsStorage() private pure returns (SettingsStorage storage $) {
        assembly {
            $.slot := SettingsLocation
        }
    }

    event UpdateSettings(SettingParams params);
    event ModifySupportedDurations(uint16 duration, bool activate, uint32 rewardWeight, uint32 stakingMultiplier);
    event ModifySpecialDurations(uint16 duration, bool activate, uint32 rewardWeight, uint32 stakingMultiplier);
    event ModifyAdmin(address newAdmin);

    modifier onlyAdmin() {
        SettingsStorage storage $ = _getSettingsStorage();
        require($._admin == msg.sender, "Not admin");
        _;
    }

    function __Settings_init(address initialAdmin) internal onlyInitializing {
        SettingsStorage storage $ = _getSettingsStorage();
        $._admin = initialAdmin;
        _modifySupportedDurations(30, true, 421500, 2500);
        _modifySupportedDurations(90, true, 1411500, 7500);
        _modifySupportedDurations(180, true, 3025500, 15000);
        _modifySupportedDurations(360, true, 6485300, 30000);
        _modifySupportedDurations(720, true, 13901600, 60000);
        _modifySupportedDurations(1080, true, 21715300, 90000);
    }

    function updateSettings(SettingParams calldata params) external onlyAdmin {
        SettingsStorage storage $ = _getSettingsStorage();
        $._rewardPerSecond = params.rewardPerSecond;
        $._minStakingAmount = params.minStakingAmount;
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
        SettingsStorage storage $ = _getSettingsStorage();
        $._admin = newAdmin;
        emit ModifyAdmin(newAdmin);
    }

    function admin() public view returns (address) {
        SettingsStorage storage $ = _getSettingsStorage();
        return $._admin;
    }

    function rewardPerSecond() public view returns (uint256) {
        SettingsStorage storage $ = _getSettingsStorage();
        return $._rewardPerSecond;
    }

    function minStakingAmount() public view returns (uint256) {
        SettingsStorage storage $ = _getSettingsStorage();
        return $._minStakingAmount;
    }

    function supportedDurations(uint16 duration) public view returns (DurationInfo memory) {
        SettingsStorage storage $ = _getSettingsStorage();
        return $._supportedDurations[duration];
    }

    function specialDurations(uint16 duration) public view returns (DurationInfo memory) {
        SettingsStorage storage $ = _getSettingsStorage();
        return $._specialDurations[duration];
    }

    function _modifySupportedDurations(
        uint16 duration, bool activate, uint32 rewardWeight, uint32 stakingMultiplier
    ) internal {
        SettingsStorage storage $ = _getSettingsStorage();
        $._supportedDurations[duration] = DurationInfo(activate, rewardWeight, stakingMultiplier);
        emit ModifySupportedDurations(duration, activate, rewardWeight, stakingMultiplier);
    }

    function _modifySpecialDurations(
        uint16 duration, bool activate, uint32 rewardWeight, uint32 stakingMultiplier
    ) internal {
        SettingsStorage storage $ = _getSettingsStorage();
        $._specialDurations[duration] = DurationInfo(activate, rewardWeight, stakingMultiplier);
        emit ModifySpecialDurations(duration, activate, rewardWeight, stakingMultiplier);
    }
}

