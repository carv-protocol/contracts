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
    bytes32 public constant NFT_ROLE = keccak256("NFT_ROLE");
    uint256 constant CarvTotalRewards = 1e18 * 1e7;
    uint256 constant NftRedeemPrice = 8e17;

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
        _grantRole(NFT_ROLE, nft);
    }

    // receive source token
    fallback() external payable{}
    receive() external payable{}

    function foundationWithdraw(address token, uint256 amount) external onlyRole(FOUNDATION_ROLE) {
        if (token == address(0)) {
            require(
                amount >= address(this).balance - (assets[SERVICE_ROLE][token] + assets[NFT_ROLE][token]),
                "Insufficient"
            );

            (bool success, ) = msg.sender.call{value: amount}(new bytes(0));
            require(success, "transfer");
        } else {
            require(
                amount >= IERC20(token).balanceOf(address(this)) - (assets[SERVICE_ROLE][token] + assets[NFT_ROLE][token]),
                "Insufficient"
            );

            IERC20(token).transfer(msg.sender, amount);
        }

        emit FoundationWithdraw(token, amount);
    }

    function nftDeposit(uint256 count) external payable onlyRole(FOUNDATION_ROLE) {
        require(msg.value == NftRedeemPrice * count, "msg.value not match");
        assets[NFT_ROLE][address(0)] += msg.value;
        emit NftDeposit(msg.value);
    }

    function nftWithdraw(bool withCarv) external onlyRole(NFT_ROLE) returns (uint256 amount) {

        if (withCarv) {
            amount = oracle(NftRedeemPrice);
            require(
                amount <= IERC20(carvToken).balanceOf(address(this)) - (assets[SERVICE_ROLE][carvToken] + assets[NFT_ROLE][carvToken]),
                "Insufficient"
            );

            IERC20(carvToken).transfer(msg.sender, amount);
        } else {
            amount = NftRedeemPrice;

            (bool success, ) = msg.sender.call{value: amount}(new bytes(0));
            require(success, "nft call");
        }

        assets[NFT_ROLE][address(0)] -= NftRedeemPrice;
        emit NftWithdraw(amount, withCarv);
        return amount;
    }

    function rewardsInit() external onlyRole(FOUNDATION_ROLE) {
        IERC20(carvToken).transferFrom(msg.sender, address(this), CarvTotalRewards);
        IERC20(carvToken).approve(veCarvToken, CarvTotalRewards);
        IveCarv(veCarvToken).deposit(CarvTotalRewards);

        assets[SERVICE_ROLE][veCarvToken] = CarvTotalRewards;
    }

    function rewardsWithdraw(address receiver, uint256 amount) external onlyRole(SERVICE_ROLE) {
        // TODO according to the rules
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
        require(carvAggregator != address(0), "no aggregator");

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
}
