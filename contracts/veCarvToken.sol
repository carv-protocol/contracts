// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IveCarv.sol";

contract veCarvToken is IveCarv, ERC20 {
    using SafeERC20 for IERC20;

    address constant DEAD = 0x000000000000000000000000000000000000dEaD;
    uint256 constant ONE = 1e18;

    uint64 public withdrawIndex;
    address public carvToken;
    address public vault;
    mapping(uint64 => WithdrawInfo) public withdrawInfos;

    constructor(string memory name, string memory symbol, address carvToken_, address vault_) ERC20(name, symbol) {
        carvToken = carvToken_;
        vault = vault_;
    }

    function transfer(address to, uint256 value) onlyVault public override returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }
    function approve(address spender, uint256 value) public override returns (bool) {
        revert("Approve not allowed");
    }
    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        revert("TransferFrom not allowed");
    }

    // foundation -> vault -> deposit
    function deposit(uint256 amount) external {
        IERC20(carvToken).transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount);
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        // A ONE CARV fee will be charged when withdrawing
        require(amount > ONE, "Must more than 1 veCARV");
        _transfer(msg.sender, address(this), amount);

        withdrawIndex++;
        withdrawInfos[withdrawIndex] = WithdrawInfo(msg.sender, false, amount-ONE, block.timestamp);

        emit Withdraw(withdrawIndex, msg.sender, amount);
    }

    function cancelWithdraw(uint64 withdrawID) external {
        WithdrawInfo storage info = withdrawInfos[withdrawID];

        require(info.withdrawer == msg.sender, "Wrong withdrawer");
        require(!info.canceledOrClaimed, "Already canceled or claimed");

        info.canceledOrClaimed = true;

        _transfer(address(this), msg.sender, info.amount);
        IERC20(carvToken).transfer(vault, ONE);

        emit CancelWithdraw(withdrawID);
    }

    function claim(uint64 withdrawID) external {
        (uint256 claimAmount, uint256 cannotClaimAmount) = _claim(withdrawID);
        uint256 tobeBurnedAmount = cannotClaimAmount/2;

        _burn(address(this), claimAmount+cannotClaimAmount+ONE);
        IERC20(carvToken).transfer(msg.sender, claimAmount);
        IERC20(carvToken).transfer(DEAD, tobeBurnedAmount);
        IERC20(carvToken).transfer(vault, cannotClaimAmount - tobeBurnedAmount);

        emit Claim(withdrawID, claimAmount);
    }

    function claimBatch(uint64[] calldata withdrawIDs) external {
        uint256 claimAmountBatch;
        uint256 cannotClaimAmountBatch;
        uint256 tobeBurnedAmountBatch;

        for (uint i = 0; i < withdrawIDs.length; i++) {
            (uint256 claimAmount, uint256 cannotClaimAmount) = _claim(withdrawIDs[i]);
            claimAmountBatch += claimAmount;
            cannotClaimAmountBatch += cannotClaimAmount;
        }
        tobeBurnedAmountBatch = cannotClaimAmountBatch/2;

        _burn(address(this), claimAmountBatch+cannotClaimAmountBatch+ONE*withdrawIDs.length);
        IERC20(carvToken).transfer(msg.sender, claimAmountBatch);
        IERC20(carvToken).transfer(DEAD, tobeBurnedAmountBatch);
        IERC20(carvToken).transfer(vault, cannotClaimAmountBatch - tobeBurnedAmountBatch);

        emit ClaimBatch(withdrawIDs, claimAmountBatch);
    }

    function _claim(uint64 withdrawID) internal returns (uint256 claimAmount, uint256 cannotClaimAmount) {
        WithdrawInfo storage info = withdrawInfos[withdrawID];

        require(info.withdrawer == msg.sender, "Not withdrawer");
        require(!info.canceledOrClaimed, "Already canceled or claimed");

        info.canceledOrClaimed = true;

        uint256 claimRatio = _claimRules(block.timestamp - info.timestamp);
        claimAmount = info.amount * claimRatio / 100;
        cannotClaimAmount = info.amount - claimAmount;

        return (claimAmount, cannotClaimAmount);
    }

    function _claimRules(uint256 timeElapsed) internal pure returns (uint256) {
        if (timeElapsed >= 150 days) {
            return 100;
        } else if (timeElapsed >= 90 days) {
            return 60;
        } else if (timeElapsed >= 15 days) {
            return 25;
        } else {
            return 0;
        }
    }

    modifier onlyVault() {
        require(vault == msg.sender, "Only vault can transfer");
        _;
    }
}
