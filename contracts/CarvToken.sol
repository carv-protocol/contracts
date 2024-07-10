// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";

contract CarvToken is OFT {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        address lzEndpoint,
        uint256 mintAmount
    ) OFT(tokenName, tokenSymbol, lzEndpoint, msg.sender) Ownable(msg.sender) {
        _mint(msg.sender, mintAmount);
    }
}
