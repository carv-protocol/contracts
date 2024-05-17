// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";

contract VRFCoordinator is IVRFCoordinatorV2Plus {
    uint256 public requestIndex;
    address public caller;

    function requestRandomWords(VRFV2PlusClient.RandomWordsRequest calldata req) external returns (uint256 requestId) {
        requestIndex++;
        caller = msg.sender;
        return requestIndex;
    }

    function callback(uint256 requestId, uint256[] memory randomWords) external {
        VRFConsumerBaseV2Plus(caller).rawFulfillRandomWords(requestId, randomWords);
    }

    function addConsumer(uint256 subId, address consumer) external {}

    function removeConsumer(uint256 subId, address consumer) external {}

    function cancelSubscription(uint256 subId, address to) external {}

    function acceptSubscriptionOwnerTransfer(uint256 subId) external {}

    function requestSubscriptionOwnerTransfer(uint256 subId, address newOwner) external {}

    function createSubscription() external returns (uint256 subId) {
        return 0;
    }

    function getSubscription(
        uint256 subId
    )
    external
    view
    returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address owner, address[] memory consumers) {
        return (balance, nativeBalance, reqCount, owner, consumers);
    }

    function pendingRequestExists(uint256 subId) external view returns (bool) {
        return true;
    }

    function getActiveSubscriptionIds(uint256 startIndex, uint256 maxCount) external view returns (uint256[] memory) {
        uint256[] memory a;
        return a;
    }

    function fundSubscriptionWithNative(uint256 subId) external payable {}
}
