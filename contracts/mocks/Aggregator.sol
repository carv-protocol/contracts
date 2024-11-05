// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Aggregator is AggregatorV3Interface, Ownable {

    struct RoundData {
        int256 answer;
        uint256 timestamp;
    }

    uint80 public roundIndex;
    mapping(uint80 => RoundData) public roundData;

    event DataUpdated(uint80 roundID, int256 answer);

    constructor() Ownable(msg.sender) {}

    function decimals() external pure returns (uint8) {
        return 8;
    }

    function description() external pure returns (string memory) {
        return "CARV / USD";
    }

    function version() external pure returns (uint256) {
        return 1;
    }

    function getRoundData(uint80 _roundId) external view returns (
        uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound
    ) {
        RoundData memory data = roundData[_roundId];
        return (
            _roundId,
            data.answer,
            data.timestamp,
            data.timestamp,
            _roundId
        );
    }

    function latestRoundData() external view returns (
        uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound
    ) {
        RoundData memory data = roundData[roundIndex];
        return (
            roundIndex,
            data.answer,
            data.timestamp,
            data.timestamp,
            roundIndex
        );
    }

    function updateData(int256 answer) external onlyOwner {
        roundIndex++;
        roundData[roundIndex] = RoundData(answer, block.timestamp);
        emit DataUpdated(roundIndex, answer);
    }
}
