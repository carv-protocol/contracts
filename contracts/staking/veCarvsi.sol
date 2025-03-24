// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract veCarvsi is AccessControlUpgradeable, MulticallUpgradeable {

    bytes32 public constant DEPOSIT_ROLE = keccak256("DEPOSIT_ROLE");
    bytes32 public constant WITHDRAW_ROLE = keccak256("WITHDRAW_ROLE");

    /*---------- token infos ----------*/
    address public token;
    string public name;
    string public symbol;
    /*---------- User position parameters ----------*/

    uint256 public totalAmount;
    mapping(address => uint256) public positions;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    function initialize(
        string memory name_, string memory symbol_, address carvToken
    ) public initializer {
        name = name_;
        symbol = symbol_;
        token = carvToken;

        __Multicall_init();
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function depositFor(address user, uint256 amount) external onlyRole(DEPOSIT_ROLE) {
        require(user != address(0), "invalid user");
        require(amount > 0, "invalid amount");

        positions[user] += amount;
        totalAmount += amount;
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit Deposit(user, amount);
    }

    function withdrawFor(address user, uint256 amount) external onlyRole(WITHDRAW_ROLE) {
        require(amount > 0, "invalid amount");
        require(positions[user] >= amount, "no enough tokens to withdraw");

        positions[user] -= amount;
        totalAmount -= amount;
        IERC20(token).transfer(msg.sender, amount);
        emit Withdraw(user, amount);
    }

    function balanceOf(address user) external view returns (uint256) {
        return positions[user];
    }

    function totalSupply() external view returns (uint256) {
        return totalAmount;
    }

    function decimals() public pure returns (uint8) {
        return 18;
    }
}
