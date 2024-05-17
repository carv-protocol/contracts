// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CarvToken is ERC20 {
    string constant NAME = "CARV";
    string constant SYMBOL = "CARV";
    uint256 constant TOTAL_SUPPLY = 1e9;

    constructor(address receiver) ERC20(NAME, SYMBOL) {
        // one billion CARV Token
        _mint(receiver, TOTAL_SUPPLY * 10**decimals());
    }
}
