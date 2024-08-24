// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCarvToken is ERC20 {
    uint256 constant TOTAL_SUPPLY = 1e9;

    constructor(string memory name, string memory symbol, address receiver) ERC20(name, symbol) {
        // one billion CARV Token
        _mint(receiver, TOTAL_SUPPLY * 10**decimals());
    }
}
