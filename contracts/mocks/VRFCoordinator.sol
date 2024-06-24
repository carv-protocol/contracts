// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";

contract VRFCoordinator is VRFCoordinatorV2Interface {
    uint256 public requestIndex;
    address public caller;

    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId) {
        requestIndex++;
        caller = msg.sender;
        return requestIndex;
    }

    function callback(uint256 requestId, uint256[] memory randomWords) external {
        VRFConsumerBaseV2Plus(caller).rawFulfillRandomWords(requestId, randomWords);
    }

    function getRequestConfig() external view returns (uint16, uint32, bytes32[] memory) {
        uint16 a;
        uint32 b;
        bytes32[] memory c;
        return (a, b, c);
    }

    function createSubscription() external returns (uint64 subId) {
        return subId;
    }

    function getSubscription(
        uint64 subId
    ) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers) {
        return (balance, reqCount, owner, consumers);
    }

    function requestSubscriptionOwnerTransfer(uint64 subId, address newOwner) external {}

    function acceptSubscriptionOwnerTransfer(uint64 subId) external {}

    function addConsumer(uint64 subId, address consumer) external {}

    function removeConsumer(uint64 subId, address consumer) external {}

    function cancelSubscription(uint64 subId, address to) external {}

    function pendingRequestExists(uint64 subId) external view returns (bool) {
        return true;
    }
}
