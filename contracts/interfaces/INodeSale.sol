// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

interface INodeSale {

    enum Payment {
        Carv,
        Eth
    }

    struct Oracle {
        address carv;
        address eth;
    }

    event ReceiverChanged(address receiver);

    event OracleChanged(Payment payment, address aggregator);

    event NftReceived(uint256 tokenID, uint32 index);

    event Purchase(address purchaser, Payment payment, uint32 count, uint32 unitIndex, uint256 price);

    function purchase(uint32 count, Payment payment) external payable;
}
