// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface ICarvVrfCallback {
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external;
}
