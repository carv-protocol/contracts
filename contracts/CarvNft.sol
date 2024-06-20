// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./interfaces/ICarvNft.sol";

contract CarvNft is ICarvNft, ERC721, Ownable {

    uint256 constant MAX_SUPPLY = 100000;

    string private baseURI;
    uint256 public tokenIndex;
    uint256 public transferProhibitedUntil;
    address public redeemAddress;

    mapping(uint256 => MetaData) public tokenMetas;
    mapping(uint256 => bool) public transferred;
    mapping(address => bool) public canTransferOnce;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) Ownable(msg.sender) {}

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(ICarvNft).interfaceId || super.supportsInterface(interfaceId);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        if (to == redeemAddress) {
            super.transferFrom(from, to, tokenId);
            return;
        }

        if (block.timestamp < transferProhibitedUntil) {
            require(canTransferOnce[from], "Transfer not allowed");
            require(!transferred[tokenId], "Already Transferred");
            transferred[tokenId] = true;
        }

        super.transferFrom(from, to, tokenId);
    }

    function mint(address receiver, uint256 count, MetaData calldata meta) public onlyOwner {
        require(tokenIndex+count <= MAX_SUPPLY, "Mint finished");
        for (uint i = 1; i <= count; i++) {
            _safeMint(receiver, tokenIndex+i);
            tokenMetas[tokenIndex+i] = meta;
        }
        tokenIndex += count;
    }

    function mintBatch(address[] calldata receivers, uint256[] calldata counts, MetaData[] calldata metas) external onlyOwner {
        require(receivers.length == counts.length && counts.length == metas.length, "Length of arr not equal");
        for (uint i = 0; i < receivers.length; i++) {
            mint(receivers[i], counts[i], metas[i]);
        }
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
    }

    function setTransferProhibitedUntil(uint256 newTransferProhibitedUntil) external onlyOwner {
        transferProhibitedUntil = newTransferProhibitedUntil;
    }

    function setRedeemAddress(address newRedeemAddress) external onlyOwner {
        redeemAddress = newRedeemAddress;
    }

    function setTransferOnceWhitelist(address[] calldata whitelist) external onlyOwner {
        require(whitelist.length > 0, "Empty whitelist");
        for (uint i = 0; i < whitelist.length; i++) {
            canTransferOnce[whitelist[i]] = true;
        }
    }
}
