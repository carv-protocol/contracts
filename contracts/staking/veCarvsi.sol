// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract veCarvsi is AccessControlUpgradeable, MulticallUpgradeable {

    struct Position {
        uint256 amount;
        uint256 startAt;
        address receiver;
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
    uint32 public apr;
    mapping(address => uint32) public userIndexes;
    mapping(address => mapping(uint32 => Position)) public positions;

    event AprSet(uint32 apr);
    event Deposit(address user, address receiver, uint32 positionID, uint256 amount);
    event Withdraw(address user, uint32 positionID, uint256 amount, uint256 reward);

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

    function setApr(uint32 newApr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        apr = newApr;
        emit AprSet(newApr);
    }

    function depositFor(address user, address receiver, uint256 amount) external onlyRole(DEPOSIT_ROLE) {
        require(user != address(0), "invalid user");
        require(receiver != address(0), "invalid receiver");
        require(amount > 0, "invalid amount");

        userIndexes[user] += 1;
        positions[user][userIndexes[user]] = Position(amount, block.timestamp, receiver);
        totalAmount += amount;
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit Deposit(user, receiver, userIndexes[user], amount);
    }

    function withdrawFor(address user, uint32 positionID) external onlyRole(WITHDRAW_ROLE) {
        Position memory position = positions[user][positionID];
        require(position.amount > 0, "no tokens to withdraw");

        uint256 reward = positionReward(position);

        totalAmount -= position.amount;
        IERC20(token).transfer(position.receiver, position.amount);
        delete positions[user][positionID];
        emit Withdraw(user, positionID, position.amount, reward);
    }

    function balanceOf(address user) external view returns (uint256) {
        uint256 totalBalance;
        for (uint32 index = 1; index <= userIndexes[user]; index++) {
            totalBalance += positions[user][index].amount;
        }
        return totalBalance;
    }

    function totalSupply() external view returns (uint256) {
        return totalAmount;
    }

    function rewardOf(address user) public view returns (uint256) {
        uint256 totalReward;
        for (uint32 index = 1; index <= userIndexes[user]; index++) {
            totalReward += positionReward(positions[user][index]);
        }
        return totalReward;
    }

    function positionReward(Position memory position) internal view returns (uint256) {
        uint256 duration = block.timestamp - position.startAt;
        return duration * uint256(apr) * position.amount / (APR_PRECISION * ONE_YEAR);
    }

    function decimals() public pure returns (uint8) {
        return 18;
    }
}
