// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";
import "./interfaces/IveCarv.sol";

contract veCarvToken is AccessControl, ERC20, Multicall, IveCarv {
    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");
    bytes32 public constant TRANSFER_FROM_ROLE = keccak256("TRANSFER_FROM_ROLE");
    uint256 constant ONE = 1e18;
    uint256 constant CLAIM_RULE_PRECISION = 10000;

    uint64 public withdrawIndex;
    address public immutable carvToken;
    address public treasury;
    mapping(uint64 => WithdrawInfo) public withdrawInfos;
    mapping(uint256 => uint32) public claimRules;

    constructor(
        string memory name, string memory symbol, address carvToken_
    ) ERC20(name, symbol) {
        carvToken = carvToken_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        claimRules[150 days] = 10000;
        claimRules[90 days] = 6000;
        claimRules[15 days] = 2500;
    }

    function deposit(uint256 amount, address receiver) external onlyRole(DEPOSITOR_ROLE) {
        _mint(receiver, amount);
        IERC20(carvToken).transferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, receiver, amount);
    }

    function withdraw(uint256 amount, uint256 duration) external {
        // A ONE CARV fee will be charged when claiming
        require(amount > ONE, "Must more than 1 veCARV");
        require(claimRules[duration] > 0, "Invalid duration");
        _transfer(msg.sender, address(this), amount);

        uint256 claimAmount = claimRules[duration] * (amount - ONE) / CLAIM_RULE_PRECISION;
        withdrawIndex++;
        withdrawInfos[withdrawIndex] = WithdrawInfo(msg.sender, false, amount, claimAmount, block.timestamp + duration);

        emit Withdraw(withdrawIndex, msg.sender, amount, duration);
    }

    function cancelWithdraw(uint64 withdrawID) external {
        WithdrawInfo storage info = withdrawInfos[withdrawID];

        require(info.withdrawer == msg.sender, "Wrong withdrawer");
        require(!info.canceledOrClaimed, "Already canceled or claimed");

        info.canceledOrClaimed = true;
        _transfer(address(this), msg.sender, info.amount);

        emit CancelWithdraw(withdrawID);
    }

    function claim(uint64 withdrawID) external {
        WithdrawInfo storage info = withdrawInfos[withdrawID];

        require(info.withdrawer == msg.sender, "Wrong withdrawer");
        require(!info.canceledOrClaimed, "Already canceled or claimed");
        require(info.endAt <= block.timestamp, "Locking");

        info.canceledOrClaimed = true;
        _burn(address(this), info.amount);
        IERC20(carvToken).transfer(msg.sender, info.claimAmount);
        IERC20(carvToken).transfer(treasury, info.amount - info.claimAmount);

        emit Claim(withdrawID, info.claimAmount);
    }

    function setTreasuryAddress(address treasury_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        treasury = treasury_;
    }

    function setClaimRules(uint256 duration, uint32 ratio) external onlyRole(DEFAULT_ADMIN_ROLE) {
        claimRules[duration] = ratio;
    }

    function transfer(address to, uint256 value) public onlyRole(TRANSFER_ROLE) override returns (bool) {
        return super.transfer(to, value);
    }

    function transferFrom(address from, address to, uint256 value) public onlyRole(TRANSFER_FROM_ROLE) override returns (bool) {
        return super.transferFrom(from, to, value);
    }
}
