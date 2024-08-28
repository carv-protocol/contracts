// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IveCarv.sol";

contract Vault is IVault, AccessControlUpgradeable {
    bytes32 public constant FOUNDATION_ROLE = keccak256("FOUNDATION_ROLE");
    bytes32 public constant SERVICE_ROLE = keccak256("SERVICE_ROLE");
    bytes32 public constant TEE_ROLE = keccak256("TEE_ROLE");

    uint256 public override startTimestamp;
    address public carvToken;
    address public veCarvToken;

    mapping(bytes32 => mapping(address => uint256)) public assets;

    // receive source token
    fallback() external payable{}
    receive() external payable{}

    function initialize(
        address carv, address veCarv, address service, uint256 startTimestamp_
    ) public initializer {
        carvToken = carv;
        veCarvToken = veCarv;
        startTimestamp = startTimestamp_;
        _grantRole(FOUNDATION_ROLE, msg.sender);
        _grantRole(SERVICE_ROLE, service);
        _grantRole(TEE_ROLE, service);
    }

    function foundationWithdraw(address token, uint256 amount) external onlyRole(FOUNDATION_ROLE) {
        if (token == address(0)) {
            require(
                amount <= address(this).balance - (assets[SERVICE_ROLE][token] + assets[TEE_ROLE][token]),
                "Insufficient eth"
            );

            (bool success, ) = msg.sender.call{value: amount}(new bytes(0));
            require(success, "Call foundation");
        } else {
            require(
                amount <= IERC20(token).balanceOf(address(this)) - (assets[SERVICE_ROLE][token] + assets[TEE_ROLE][token]),
                "Insufficient erc20"
            );

            IERC20(token).transfer(msg.sender, amount);
        }

        emit FoundationWithdraw(token, amount);
    }

    function teeDeposit(uint256 amount) external onlyRole(TEE_ROLE) {
        IERC20(carvToken).approve(veCarvToken, amount);
        IveCarv(veCarvToken).deposit(amount, address(this));
        assets[TEE_ROLE][veCarvToken] += amount;
        emit TeeDeposit(amount);
    }

    function teeWithdraw(address receiver, uint256 amount) external onlyRole(TEE_ROLE) {
        require(assets[TEE_ROLE][veCarvToken] >= amount, "Insufficient veCARV");
        IERC20(veCarvToken).transfer(receiver, amount);
        assets[TEE_ROLE][veCarvToken] -= amount;
        emit TeeWithdraw(receiver, amount);
    }

    function rewardsDeposit(uint256 amount) external onlyRole(FOUNDATION_ROLE) {
        IERC20(carvToken).transferFrom(msg.sender, address(this), amount);
        IERC20(carvToken).approve(veCarvToken, amount);
        IveCarv(veCarvToken).deposit(amount, address(this));

        assets[SERVICE_ROLE][veCarvToken] = amount;
        emit RewardsDeposit(amount);
    }

    function rewardsWithdraw(address receiver, uint256 amount) external onlyRole(SERVICE_ROLE) {
        IERC20(veCarvToken).transfer(receiver, amount);
        assets[SERVICE_ROLE][veCarvToken] -= amount;
        emit RewardsWithdraw(receiver, amount);
    }

    function changeFoundation(address newFoundation) external onlyRole(FOUNDATION_ROLE) {
        _revokeRole(FOUNDATION_ROLE, msg.sender);
        _grantRole(FOUNDATION_ROLE, newFoundation);
        emit ChangeFoundation(newFoundation);
    }

    function totalRewardByDate(uint32 dateIndex) external pure returns (uint256) {
        if (dateIndex <= 180) {
            return 385850e18;
        } else if (dateIndex <= 360) {
            return 289387e18;
        } else if (dateIndex <= 540) {
            return 217040e18;
        } else if (dateIndex <= 720) {
            return 162780e18;
        } else if (dateIndex <= 900) {
            return 122085e18;
        } else if (dateIndex <= 1080) {
            return 91564e18;
        } else if (dateIndex <= 1260) {
            return 68673e18;
        } else if (dateIndex <= 1440) {
            return 51504e18;
        } else {
            return 0;
        }
    }
}
