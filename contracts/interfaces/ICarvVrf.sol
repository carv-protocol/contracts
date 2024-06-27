// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface ICarvVrf {
    function requestRandomWords(bool) external returns (uint256);
}