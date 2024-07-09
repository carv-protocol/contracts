// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";

contract CarvToken is OFT {
    uint256 constant TOTAL_SUPPLY = 1e9;

    string private constant tokenName = "T-T";
    string private constant tokenSymbol = "T-T";
    address private constant lzEndpoint = 0x6EDCE65403992e310A62460808c4b910D972f10f;

    constructor() OFT(tokenName, tokenSymbol, lzEndpoint, msg.sender) Ownable(msg.sender) {
        // one billion CARV Token
        _mint(msg.sender, TOTAL_SUPPLY * 10**decimals());
    }
}
