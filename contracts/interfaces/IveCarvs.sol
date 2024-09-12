// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

interface IveCarvs {

    struct Position {
        address user;
        bool finalized;
        uint256 balance;
        uint256 end;
        uint256 share;
        uint256 debt;
    }

    struct EpochPoint {
        uint256 bias;
        int256 slope;
        uint32 epochIndex;
    }

    event DepositRewardToken(address indexed depositor, uint256 amount);
    event Deposit(uint64 indexed positionID, address indexed user, uint256 amount,
        uint256 begin, uint256 duration, uint256 share, uint256 debt);
    event Finalize(uint64 indexed positionID, uint256 reward);
    event Withdraw(uint64 indexed positionID);
    event Claim(uint64 indexed positionID, uint256 reward);
    event UpdateShare(uint256 accumulatedRewardPerShare);
    event NewPoint(address user, uint256 bias, int256 slope, uint32 epochIndex);
    event UpdateCurrentPoint(address user, uint256 slope, uint256 initialBias, uint32 endEpoch);

    function deposit(uint256 amount, uint256 duration) external;
    function depositForSpecial(address user, uint256 amount, uint256 duration) external;
    function withdraw(uint64 positionID) external;
    function claim(uint64 positionID) external;
    function finalize(uint64 positionID) external;
}
