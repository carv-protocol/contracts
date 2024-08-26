// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/Multicall.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Settings.sol";

contract veCarvs is Settings, Multicall {
    struct Position {
        address user;
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

    /*---------- token infos ----------*/
    address public token;
    string public name;
    string public symbol;

    /*---------- Global reward parameters ----------*/
    uint256 public constant PRECISION = 1e18;
    uint256 public accumulatedRewardPerShare;
    uint256 public totalShare;
    uint256 public lastRewardTimestamp;
    uint256 public rewardTokenAmount;

    /*---------- Global algorithm parameters ----------*/
    // The contract will define the length of min time period here.
    uint256 public constant DURATION_PER_EPOCH = 1 days;
    uint256 public initialTimestamp;
    // epoch -> delta slope
    mapping(uint32 => int256) public slopeChanges;
    // epoch -> point
    EpochPoint[] public epochPoints;

    /*---------- User algorithm parameters ----------*/
    mapping(address => mapping(uint32 => int256)) public userSlopeChanges;
    mapping(address => EpochPoint[]) public userEpochPoints;

    /*---------- User position parameters ----------*/
    uint64 public positionIndex;
    mapping(uint64 => Position) public positions;

    /*---------- event ----------*/
    event Deposit(uint64 indexed positionID, address indexed user, uint256 amount,
        uint256 begin, uint256 duration, uint256 share, uint256 debt);
    event Withdraw(uint64 indexed positionID, uint256 reward);
    event Claim(uint64 indexed positionID, uint256 reward);
    event UpdateShare(uint256 accumulatedRewardPerShare);

    function initialize(
        string memory name_, string memory symbol_, address carvToken
    ) public initializer {
        name = name_;
        symbol = symbol_;
        token = carvToken;
        initialTimestamp = (block.timestamp / DURATION_PER_EPOCH) * DURATION_PER_EPOCH;
        epochPoints.push(EpochPoint(0, 0, 0));
        __Settings_init(msg.sender);
    }

    function depositRewardToken(uint256 amount) external {
        require(amount > 0, "invalid amount");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        rewardTokenAmount += amount;
    }

    function deposit(uint256 amount, uint256 duration) external {
        require(duration % DURATION_PER_EPOCH == 0, "invalid duration");
        require(amount >= minStakingAmount, "invalid amount");

        DurationInfo memory durationInfo = supportedDurations[uint16(duration/DURATION_PER_EPOCH)];
        require(durationInfo.active, "invalid duration");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        _updateShare();

        uint256 beginTimestamp = (block.timestamp / DURATION_PER_EPOCH) * DURATION_PER_EPOCH;
        uint256 share = amount * durationInfo.rewardWeight / DURATION_INFO_DECIMALS;
        uint256 debt = (share * accumulatedRewardPerShare) / PRECISION;

        positionIndex++;
        positions[positionIndex] = Position(msg.sender, amount, beginTimestamp + duration, share, debt);
        totalShare += share;

        checkEpoch(msg.sender);
        _updateCurrentPoint(msg.sender, durationInfo.stakingMultiplier, amount, beginTimestamp, duration);

        emit Deposit(positionIndex, msg.sender, amount, beginTimestamp, duration, share, debt);
    }

    function withdraw(uint64 positionID) external {
        Position storage position = positions[positionID];
        require(position.user == msg.sender, "user not match or already withdrawn");
        require(position.end <= block.timestamp, "locked");

        _updateShare();

        uint256 pendingReward = (position.share * accumulatedRewardPerShare) / PRECISION - position.debt;
        IERC20(token).transfer(msg.sender, position.balance+pendingReward);
        rewardTokenAmount -= pendingReward;
        totalShare -= position.share;
        delete positions[positionID];
        emit Withdraw(positionID, pendingReward);
    }

    function claim(uint64 positionID) external {
        Position storage position = positions[positionID];
        require(position.user == msg.sender, "user not match or already withdrawn");

        _updateShare();

        uint256 pendingReward = (position.share * accumulatedRewardPerShare) / PRECISION - position.debt;
        if (pendingReward > 0) {
            IERC20(token).transfer(msg.sender, pendingReward);
            rewardTokenAmount -= pendingReward;
            position.debt = (position.share * accumulatedRewardPerShare) / PRECISION;
            emit Claim(positionID, pendingReward);
        }
    }

    function balanceOf(address user) external view returns (uint256) {
        return balanceOfAt(user, block.timestamp);
    }

    function totalSupply() external view returns (uint256) {
        return totalSupplyAt(block.timestamp);
    }

    function checkEpoch(address withUser) public {
        _checkEpoch(epochPoints, slopeChanges);

        if (withUser != address(0)) {
            if (userEpochPoints[withUser].length == 0) {
                // initialize user array
                userEpochPoints[withUser].push(EpochPoint(0, 0, epoch()));
                return;
            }
            _checkEpoch(userEpochPoints[withUser], userSlopeChanges[withUser]);
        }
    }

    function balanceOfAt(address user, uint256 timestamp) public view returns (uint256) {
        return _biasAt(userEpochPoints[user], userSlopeChanges[user], timestamp);
    }

    function totalSupplyAt(uint256 timestamp) public view returns (uint256) {
        return _biasAt(epochPoints, slopeChanges, timestamp);
    }

    function epoch() public view returns (uint32) {
        return epochAt(block.timestamp);
    }

    function epochAt(uint256 timestamp) public view returns (uint32) {
        return uint32((timestamp - initialTimestamp) / DURATION_PER_EPOCH);
    }

    function epochTimestamp(uint32 epochIndex) public view returns (uint256) {
        return epochIndex * DURATION_PER_EPOCH + initialTimestamp;
    }

    function decimals() public pure returns (uint8) {
        return 18;
    }

    function _updateShare() internal {
        if (block.timestamp <= lastRewardTimestamp) {
            return;
        }

        if (totalShare == 0) {
            lastRewardTimestamp = block.timestamp;
            return;
        }

        uint256 newReward = (block.timestamp - lastRewardTimestamp) * rewardPerSecond;
        accumulatedRewardPerShare += (newReward * PRECISION) / totalShare;
        lastRewardTimestamp = block.timestamp;
        emit UpdateShare(accumulatedRewardPerShare);
    }

    function _checkEpoch(EpochPoint[] storage epochPoints_, mapping(uint32 => int256) storage slopeChanges_) internal {
        uint32 currentEpoch = epoch();
        uint32 lastRecordEpoch = epochPoints_[epochPoints_.length-1].epochIndex;

        if (currentEpoch <= lastRecordEpoch) {
            return;
        }

        // From the epoch of the previous Point to the current epoch
        for (uint32 epochIndex = lastRecordEpoch+1; epochIndex <= currentEpoch; epochIndex++) {
            // EpochPoints will be updated only when the slope changes or reaches the current epoch.
            if (slopeChanges_[epochIndex] == 0 && epochIndex < currentEpoch) {
                continue;
            }

            EpochPoint memory lastEpochPoint = epochPoints_[epochPoints_.length-1];
            EpochPoint memory newEpochPoint;
            newEpochPoint.slope = lastEpochPoint.slope + slopeChanges_[epochIndex];
            newEpochPoint.bias = _calculate(lastEpochPoint.bias, lastEpochPoint.slope, (epochIndex - lastEpochPoint.epochIndex) * DURATION_PER_EPOCH);
            newEpochPoint.epochIndex = epochIndex;
            epochPoints_.push(newEpochPoint);
        }
    }

    // update slope and bias
    function _updateCurrentPoint(
        address user, uint32 stakingMultiplier, uint256 amount, uint256 beginTimestamp, uint256 duration
    ) internal {
        uint256 initialBias = amount * stakingMultiplier / DURATION_INFO_DECIMALS;
        uint256 slope = initialBias / duration + 1;
        uint32 endEpoch = epochAt(beginTimestamp + duration);

        // update global slope and bias
        slopeChanges[endEpoch] -= int256(slope);
        epochPoints[epochPoints.length-1].slope += int256(slope);
        epochPoints[epochPoints.length-1].bias += initialBias;
        // update user's slope and bias
        userSlopeChanges[user][endEpoch] -= int256(slope);
        userEpochPoints[user][userEpochPoints[user].length-1].slope += int256(slope);
        userEpochPoints[user][userEpochPoints[user].length-1].bias += initialBias;
    }

    function _biasAt(EpochPoint[] memory epochPoints_, mapping(uint32 => int256) storage slopeChanges_, uint256 timestamp) internal view returns (uint256) {
        EpochPoint memory lastRecordEpochPoint = epochPoints_[epochPoints_.length-1];
        uint32 targetEpoch = epochAt(timestamp);

        if (targetEpoch < lastRecordEpochPoint.epochIndex) {
            for (uint256 epochPointsIndex = epochPoints_.length-2; ; epochPointsIndex--) {
                EpochPoint memory epochPoint = epochPoints_[epochPointsIndex];
                if (targetEpoch >= epochPoint.epochIndex) {
                    return _calculate(epochPoint.bias, epochPoint.slope, timestamp - epochTimestamp(epochPoint.epochIndex));
                }
            }
        }

        uint256 tmpBias = lastRecordEpochPoint.bias;
        int256 tmpSlope = lastRecordEpochPoint.slope;
        for (uint32 epochIndex = lastRecordEpochPoint.epochIndex; epochIndex < targetEpoch; epochIndex++) {
            tmpBias = _calculate(tmpBias, tmpSlope, DURATION_PER_EPOCH);
            tmpSlope += slopeChanges_[epochIndex+1];
        }
        return _calculate(tmpBias, tmpSlope, timestamp - epochTimestamp(targetEpoch));
    }

    function _calculate(uint256 bias, int256 slope, uint256 duration) internal pure returns (uint256) {
        if (bias < uint256(slope) * (duration)) {
            return 0;
        }
        return (bias - uint256(slope) * (duration));
    }
}
