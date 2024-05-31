// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ICarvNft.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IProtocolService.sol";

contract CarvNft is ICarvNft, ERC721 {
    using SafeERC20 for IERC20;

    uint256 constant REDEEM_DURATION = 180 days;
    uint256 constant CLAIM_DURATION = 30 days;
    uint256 constant MAX_SUPPLY = 100000;
    string constant NAME = "CarvNft";
    string constant SYMBOL = "CarvNft";

    address public vault;
    address public service;
    address public carvToken;

    uint256 public tokenIndex;
    mapping(uint256 => uint256) public tokenIDMintedAt;
    mapping(uint256 => ClaimInfo) public claimInfos;

    constructor(address carvToken_, address vault_, address service_) ERC721(NAME, SYMBOL) {
        carvToken = carvToken_;
        vault = vault_;
        service = service_;
    }

    // receive source token
    fallback() external payable{}
    receive() external payable{}

    function approve(address to, uint256 tokenId) public override {
        revert("Approve not allowed");
    }
    function setApprovalForAll(address operator, bool approved) public override {
        revert("SetApprovalForAll not allowed");
    }
    function transferFrom(address from, address to, uint256 tokenId) public override {
        revert("TransferFrom not allowed");
    }
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        revert("SafeTransferFrom not allowed");
    }

    function mint() external {
        require(tokenIndex < MAX_SUPPLY, "Mint finished");

        tokenIndex++;
        _safeMint(msg.sender, tokenIndex);
        tokenIDMintedAt[tokenIndex] = block.timestamp;

        emit Mint(msg.sender, tokenIndex);
    }

    function redeem(uint256 tokenID, bool withCarv) external {
        require(ownerOf(tokenID) == msg.sender, "Not owner");
        require(!IProtocolService(service).checkClaimed(tokenID), "Rewards already claimed");
        require(block.timestamp - tokenIDMintedAt[tokenID] > REDEEM_DURATION, "Cannot redeem within 180 days");

        _burn(tokenID);

        uint256 amount = IVault(vault).nftWithdraw(withCarv);

        if (withCarv) {
            claimInfos[tokenID] = ClaimInfo(msg.sender, amount, 0, block.timestamp);
        } else {
            (bool success, ) = msg.sender.call{value: amount}(new bytes(0));
            require(success, "Call msg sender");
        }

        emit Redeem(tokenID, amount, withCarv);
    }

    function claim(uint256 tokenID) external {
        uint256 claimAmount = _claim(tokenID);
        IERC20(carvToken).transfer(msg.sender, claimAmount);

        emit Claim(tokenID, claimAmount);
    }

    function claimBatch(uint256[] calldata tokenIDs) external {
        uint256 totalClaimAmount;
        for (uint i = 0; i < tokenIDs.length; i++) {
            totalClaimAmount += _claim(tokenIDs[i]);
        }
        IERC20(carvToken).transfer(msg.sender, totalClaimAmount);

        emit ClaimBatch(tokenIDs, totalClaimAmount);
    }

    function _claim(uint256 tokenID) internal returns (uint256 toBeClaim) {
        ClaimInfo storage info = claimInfos[tokenID];
        require(msg.sender == info.redeemer, "Not redeemer");

        uint256 duration = CLAIM_DURATION;
        if (block.timestamp - info.redeemTimestamp < CLAIM_DURATION) {
            duration = block.timestamp - info.redeemTimestamp;
        }

        uint256 canBeClaimed = info.amount * duration / CLAIM_DURATION;
        require(canBeClaimed >= info.claimed, "Already claimed");
        info.claimed = canBeClaimed;
        toBeClaim += canBeClaimed - info.claimed;
        return toBeClaim;
    }
}
