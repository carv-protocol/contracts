// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";

contract GenerateOptions {
    using OptionsBuilder for bytes;

    function getOptions(uint128 gas, uint128 value) external pure returns (bytes memory) {
        return OptionsBuilder.newOptions().addExecutorLzReceiveOption(gas, value);
    }
}
