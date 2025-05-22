// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

interface IveCarvsView {
    function balanceOfAt(address user, uint256 timestamp) external view returns (uint256);

    function totalSupplyAt(uint256 timestamp) external view returns (uint256);

    function epoch() external view returns (uint32);

    function epochAt(uint256 timestamp) external view returns (uint32);

    function epochTimestamp(uint32 epochIndex) external view returns (uint256);
}
