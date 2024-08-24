// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Settings is Initializable {

    struct SettingParams {
        uint256 rewardPerSecond;
        uint256 minStakingAmount;
        uint16 rewardFactor;
        uint16 stakingFactor;
    }

    uint256 public rewardPerSecond;
    uint256 public minStakingAmount;
    uint16 public rewardFactor;
    // Carv is exchanged for veCarv(s) according to a linear exchange,
    // and veCarv(s) is obtained at a ratio of 1:1 after [stakingFactor] epochs.
    uint16 public stakingFactor;
    address public admin;
    // Users' depositing duration can only be within a limited range
    mapping(uint16 => bool) public supportedDuration;

    event UpdateSettings(SettingParams params);
    event ModifyAdmin(address newAdmin);

    modifier onlyAdmin() {
        require(admin == msg.sender, "Not admin");
        _;
    }

    function __Settings_init(address initialAdmin) internal onlyInitializing {
        admin = initialAdmin;
        supportedDuration[30] = true;
        supportedDuration[90] = true;
        supportedDuration[180] = true;
        supportedDuration[360] = true;
        supportedDuration[720] = true;
        supportedDuration[1080] = true;
    }

    function updateSettings(SettingParams calldata params) external onlyAdmin {
        rewardPerSecond = params.rewardPerSecond;
        rewardFactor = params.rewardFactor;
        stakingFactor = params.stakingFactor;
        minStakingAmount = params.minStakingAmount;
        emit UpdateSettings(params);
    }

    function modifySupportedDuration(uint16 duration, bool activate) external onlyAdmin {
        supportedDuration[duration] = activate;
    }

    function modifyAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
        emit ModifyAdmin(newAdmin);
    }
}

