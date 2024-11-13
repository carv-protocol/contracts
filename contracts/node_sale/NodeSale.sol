// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/INodeSale.sol";

contract NodeSale is OwnableUpgradeable, IERC721Receiver, INodeSale {

    uint256 public constant INITIAL_PRICE = 1500e18;
    uint256 public constant PRICE_CHANGE_PER_UNIT = 100e18;
    uint32 public constant UNIT_LENGTH = 1000;
    uint8 private constant CARV_RESERVED_DECIMALS = 1;
    uint8 private constant ETH_RESERVED_DECIMALS = 4;
    uint8 private constant BASE_DECIMALS = 18;

    Oracle public oracle;
    address public carvToken;
    address public carvNft;
    address public receiver;
    uint32 public purchasedCount;
    uint32[] public tokenIDList;

    constructor() {
        _disableInitializers();
    }

    function initialize(address carvToken_, address carvNft_) external initializer {
        require(carvToken_ != address(0) && carvNft_ != address(0), "address cannot be zero");
        carvToken = carvToken_;
        carvNft = carvNft_;
        __Ownable_init(msg.sender);
    }

    function onERC721Received(address, address, uint256 tokenId, bytes calldata) external returns (bytes4) {
        require(msg.sender == carvNft, "illegal receive");
        tokenIDList.push(uint32(tokenId));
        emit NftReceived(tokenId, uint32(tokenIDList.length-1));
        return IERC721Receiver.onERC721Received.selector;
    }

    function setReceiver(address receiver_) external onlyOwner {
        require(receiver_ != address(0), "address cannot be zero");
        receiver = receiver_;
        emit ReceiverChanged(receiver_);
    }

    function setOracle(Payment payment, address aggregator) external onlyOwner {
        require(aggregator != address(0), "address cannot be zero");
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
        require(receiver != address(0), "no receiver");
        require(count <= UNIT_LENGTH - purchasedCount % UNIT_LENGTH, "unit limited");
        require(count <= tokenIDList.length - purchasedCount, "no nft available");

        uint32 unitIndex = currentUnitIndex();
        uint256 priceUSD = INITIAL_PRICE + uint256(unitIndex)*PRICE_CHANGE_PER_UNIT;
        uint256 price;

        if (payment == Payment.Carv) {
            require(msg.value == 0, "msg.value should be 0 when payment is CARV");
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

        for (uint32 i; i < count; i++) {
            IERC721(carvNft).transferFrom(address(this), msg.sender, tokenIDList[purchasedCount+i]);
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
        uint80 roundID,
        int answer,
        uint startedAt,
        uint updatedAt,
        uint80 answeredInRound
        ) = dataFeed.latestRoundData();

        require(answer > 0, "price should be greater than zero");
        require(startedAt > 0 && updatedAt > 0, "timestamp should not be zero");
        require(answeredInRound >= roundID, "answeredInRound should be equal to or greater than roundID.");

        return priceUSD * (10**decimals) / uint256(answer);
    }

    function procPrecision(uint256 raw, uint8 reservedDecimals) internal pure returns (uint256) {
        return raw - (raw % 10**(BASE_DECIMALS - reservedDecimals));
    }

}
