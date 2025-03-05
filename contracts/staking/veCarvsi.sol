// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract veCarvsi is AccessControlUpgradeable, MulticallUpgradeable {

    struct Position {
        uint256 amount;
        uint256 startAt;
    }

    bytes32 public constant DEPOSIT_ROLE = keccak256("DEPOSIT_ROLE");
    bytes32 public constant WITHDRAW_ROLE = keccak256("WITHDRAW_ROLE");
    uint256 public constant ONE_YEAR = 365 days;
    uint256 public constant APR_PRECISION = 10000;

    /*---------- token infos ----------*/
    address public token;
    string public name;
    string public symbol;
    /*---------- User position parameters ----------*/

    uint256 public totalAmount;
    uint256 public minLockingDuration;
    uint32 public apr;
    mapping(address => Position) public positions;

    event MinLockingDurationSet(uint256 minLockingDuration);
    event AprSet(uint32 apr);
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount, uint256 reward);

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

    function setMinLockingDuration(uint256 newMinLockingDuration) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minLockingDuration = newMinLockingDuration;
        emit MinLockingDurationSet(newMinLockingDuration);
    }

    function setApr(uint32 newApr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        apr = newApr;
        emit AprSet(newApr);
    }

    function depositFor(address user, uint256 amount) external onlyRole(DEPOSIT_ROLE) {
        require(user != address(0), "invalid user");
        require(amount > 0, "invalid amount");
        require(positions[user].amount == 0, "user already deposited");

        positions[user] = Position(amount, block.timestamp);
        totalAmount += amount;
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit Deposit(user, amount);
    }

    function withdrawFor(address user, uint256 amount) external onlyRole(WITHDRAW_ROLE) {
        Position memory position = positions[user];
        require(position.amount > 0, "no tokens to withdraw");
        require(position.amount == amount, "amount not match");
        require(block.timestamp - position.startAt >= minLockingDuration);

        uint256 reward = rewardOf(user);

        totalAmount -= amount;
        IERC20(token).transfer(msg.sender, position.amount);
        delete positions[user];
        emit Withdraw(user, amount, reward);
    }

    function balanceOf(address user) external view returns (uint256) {
        return positions[user].amount;
    }

    function totalSupply() external view returns (uint256) {
        return totalAmount;
    }

    function rewardOf(address user) public view returns (uint256) {
        Position memory position = positions[user];
        uint256 duration = block.timestamp - position.startAt;
        if (duration > minLockingDuration) {
            duration = minLockingDuration;
        }
        return duration * uint256(apr) * position.amount / (APR_PRECISION * ONE_YEAR);
    }

    function decimals() public pure returns (uint8) {
        return 18;
    }
}
