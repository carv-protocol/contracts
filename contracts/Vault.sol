// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IveCarv.sol";

contract Vault is IVault, AccessControlUpgradeable {
    using SafeERC20 for IERC20;

    bytes32 public constant FOUNDATION_ROLE = keccak256("FOUNDATION_ROLE");
    bytes32 public constant SERVICE_ROLE = keccak256("SERVICE_ROLE");
    bytes32 public constant TEE_ROLE = keccak256("TEE_ROLE");
    bytes32 public constant NFT_ROLE = keccak256("NFT_ROLE");
    uint256 constant CARV_TOTAL_REWARDS = 25e7 * 1e18; // todo calculate
    uint256 constant NFT_REDEEM_PRICE = 8e17; // decimal: 18
    uint256 constant START_TIMESTAMP = 1704038400;

    address public carvToken;
    address public veCarvToken;
    address public carvAggregator; // CARV/ETH

    mapping(bytes32 => mapping(address => uint256)) public assets;

    constructor(address carv, address veCarv) {
        carvToken = carv;
        veCarvToken = veCarv;
    }

    function initialize(address foundation, address nft, address service) public initializer {
        __AccessControl_init();
        _grantRole(FOUNDATION_ROLE, foundation);
        _grantRole(SERVICE_ROLE, service);
        _grantRole(TEE_ROLE, service);
        _grantRole(NFT_ROLE, nft);
    }

    // receive source token
    fallback() external payable{}
    receive() external payable{}

    function foundationWithdraw(address token, uint256 amount) external onlyRole(FOUNDATION_ROLE) {
        if (token == address(0)) {
            require(
                amount >= address(this).balance - (assets[SERVICE_ROLE][token] + assets[NFT_ROLE][token]),
                "Insufficient eth"
            );

            (bool success, ) = msg.sender.call{value: amount}(new bytes(0));
            require(success, "Call foundation");
        } else {
            require(
                amount >= IERC20(token).balanceOf(address(this)) - (assets[SERVICE_ROLE][token] + assets[NFT_ROLE][token]),
                "Insufficient erc20"
            );

            IERC20(token).transfer(msg.sender, amount);
        }

        emit FoundationWithdraw(token, amount);
    }

    function nftDeposit(uint256 count) external payable onlyRole(FOUNDATION_ROLE) {
        require(msg.value == NFT_REDEEM_PRICE * count, "Wrong msg.value");
        assets[NFT_ROLE][address(0)] += msg.value;
        emit NftDeposit(msg.value);
    }

    function nftWithdraw(bool withCarv) external onlyRole(NFT_ROLE) returns (uint256 amount) {

        if (withCarv) {
            amount = oracle(NFT_REDEEM_PRICE);
            require(
                amount <= IERC20(carvToken).balanceOf(address(this)) - (assets[SERVICE_ROLE][carvToken] + assets[NFT_ROLE][carvToken]),
                "Insufficient CARV"
            );

            IERC20(carvToken).transfer(msg.sender, amount);
        } else {
            amount = NFT_REDEEM_PRICE;

            (bool success, ) = msg.sender.call{value: amount}(new bytes(0));
            require(success, "Call nft");
        }

        assets[NFT_ROLE][address(0)] -= NFT_REDEEM_PRICE;
        emit NftWithdraw(amount, withCarv);
        return amount;
    }

    function teeDeposit(uint256 amount) external onlyRole(TEE_ROLE) {
        IERC20(carvToken).approve(veCarvToken, amount);
        IveCarv(veCarvToken).deposit(amount);
        assets[TEE_ROLE][veCarvToken] += amount;
        emit TeeDeposit(amount);
    }

    function teeWithdraw(address receiver, uint256 amount) external onlyRole(TEE_ROLE) {
        require(assets[TEE_ROLE][veCarvToken] >= amount, "Insufficient veCARV");
        IERC20(veCarvToken).transfer(receiver, amount);
        assets[TEE_ROLE][veCarvToken] -= amount;
        emit TeeWithdraw(receiver, amount);
    }

    function rewardsInit() external onlyRole(FOUNDATION_ROLE) {
        IERC20(carvToken).transferFrom(msg.sender, address(this), CARV_TOTAL_REWARDS);
        IERC20(carvToken).approve(veCarvToken, CARV_TOTAL_REWARDS);
        IveCarv(veCarvToken).deposit(CARV_TOTAL_REWARDS);

        assets[SERVICE_ROLE][veCarvToken] = CARV_TOTAL_REWARDS;
    }

    function rewardsWithdraw(address receiver, uint256 amount) external onlyRole(SERVICE_ROLE) {
        IERC20(veCarvToken).transfer(receiver, amount);
        assets[SERVICE_ROLE][veCarvToken] -= amount;
    }

    function changeFoundation(address newFoundation) external onlyRole(FOUNDATION_ROLE) {
        _revokeRole(FOUNDATION_ROLE, msg.sender);
        _grantRole(FOUNDATION_ROLE, newFoundation);
        emit ChangeFoundation(newFoundation);
    }

    function updateAggregatorAddress(address carvAggregator_) external onlyRole(FOUNDATION_ROLE) {
        carvAggregator = carvAggregator_;
        emit UpdateAggregator(carvAggregator_);
    }

    // eth -> carv in Real Time Exchange Rates
    function oracle(uint256 ethAmount) public view returns (uint256 carvAmount) {
        require(carvAggregator != address(0), "No aggregator");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(carvAggregator);
        (
        /* uint80 roundID */,
        int answer,
        /*uint startedAt*/,
        /*uint timeStamp*/,
        /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        uint8 decimals = priceFeed.decimals();

        return ethAmount * uint256(10 ** decimals) / uint256(answer);
    }

    function startTimestamp() external pure returns (uint256) {
        return START_TIMESTAMP;
    }

    function totalRewardByDate(uint32 dateIndex) external pure returns (uint256) {
        if (dateIndex <= 180) {
            return 385850e18;
        } else if (dateIndex <= 360) {
            return 289387e18;
        } else if (dateIndex <= 540) {
            return 217040e18;
        } else if (dateIndex <= 720) {
            return 162780e18;
        } else if (dateIndex <= 900) {
            return 122085e18;
        } else if (dateIndex <= 1080) {
            return 91564e18;
        } else if (dateIndex <= 1260) {
            return 68673e18;
        } else if (dateIndex <= 1440) {
            return 51504e18;
        } else {
            return 0;
        }
    }
}
