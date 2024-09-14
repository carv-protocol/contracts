// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

interface ISBT {
    event Authorize(address to);
    event Claim(address to, uint256 tokenID);

    function setURI(string calldata newBaseURI) external;

    function authorize(address to) external;

    function claim() external;
}

