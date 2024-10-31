// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/INodeSale.sol";

contract NodeSale is INodeSale, OwnableUpgradeable {

    uint256 public constant INITIAL_PRICE = 1500e18;
    uint256 public constant PRICE_CHANGE_PER_UNIT = 100e18;
    uint32 public constant UNIT_LENGTH = 1000;
    uint8 private constant CARV_RESERVED_DECIMALS = 1;
    uint8 private constant ETH_RESERVED_DECIMALS = 4;
    uint8 private constant BASE_DECIMALS = 18;

    Oracle public oracle;
    address public carvToken;
    address public receiver;
    uint32 public purchasedCount;

    function initialize(address carvToken_, address receiver_) external initializer {
        carvToken = carvToken_;
        receiver = receiver_;
        __Ownable_init(msg.sender);
    }

    function setReceiver(address receiver_) external onlyOwner {
        receiver = receiver_;
        emit ReceiverChanged(receiver_);
    }

    function setOracle(Payment payment, address aggregator) external onlyOwner {
        if (payment == Payment.Carv) {
            oracle.carv = aggregator;
        } else if (payment == Payment.Eth) {
            oracle.eth = aggregator;
        } else {
            revert("unknown payment");
        }
        emit OracleChanged(payment, aggregator);
    }

    function purchase(uint32 count, Payment payment) external payable {
        require(count > 0, "zero purchase count");
        require(count <= UNIT_LENGTH - purchasedCount % UNIT_LENGTH, "unit limited");

        uint32 unitIndex = currentUnitIndex();
        uint256 priceUSD = INITIAL_PRICE + uint256(unitIndex)*PRICE_CHANGE_PER_UNIT;
        uint256 price;

        if (payment == Payment.Carv) {
            price = usd2carv(priceUSD);
            IERC20(carvToken).transferFrom(msg.sender, receiver, price * uint256(count));
        } else if (payment == Payment.Eth) {
            price = usd2eth(priceUSD);
            uint256 payAmount = price * uint256(count);
            require(msg.value >= payAmount, "insufficient eth");
            payable(receiver).transfer(payAmount);
            if (msg.value > payAmount) {
                payable(msg.sender).transfer(msg.value - payAmount);
            }
        } else {
            revert("unknown payment");
        }

        purchasedCount += count;
        emit Purchase(msg.sender, payment, count, unitIndex, price);
    }

    function currentUnitIndex() public view returns (uint32) {
        return purchasedCount / UNIT_LENGTH;
    }

    function usd2carv(uint256 priceUSD) public view returns (uint256 priceCARV) {
        return procPrecision(calPrice(priceUSD, oracle.carv), CARV_RESERVED_DECIMALS);
    }

    function usd2eth(uint256 priceUSD) public view returns (uint256 priceETH) {
        return procPrecision(calPrice(priceUSD, oracle.eth), ETH_RESERVED_DECIMALS);
    }

    function calPrice(uint256 priceUSD, address aggregator) internal view returns (uint256) {
        require(aggregator != address(0), "empty aggregator");
        AggregatorV3Interface dataFeed = AggregatorV3Interface(aggregator);

        uint8 decimals = dataFeed.decimals();
        (
        /* uint80 roundID */,
        int answer,
        /*uint startedAt*/,
        /*uint updatedAt*/,
        /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();

        return priceUSD * (10**decimals) / uint256(answer);
    }

    function procPrecision(uint256 raw, uint8 reservedDecimals) internal pure returns (uint256) {
        return raw - (raw % 10**(BASE_DECIMALS - reservedDecimals));
    }

}
