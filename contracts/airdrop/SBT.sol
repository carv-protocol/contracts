// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../interfaces/ISBT.sol";

contract SBT is AccessControl, ERC721, ISBT {

    bytes32 public constant AIRDROP_ROLE = keccak256("AIRDROP_ROLE");

    string private uri;
    uint256 public tokenIndex;
    mapping(address => bool) public auth;
    mapping(address => bool) public minted;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC721) returns (bool) {
        return interfaceId == type(ISBT).interfaceId || super.supportsInterface(interfaceId);
    }

    function setURI(string calldata newUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uri = newUri;
    }

    function authorize(address to) external onlyRole(AIRDROP_ROLE) {
        auth[to] = true;
        emit Authorize(to);
    }

    function claim() external {
        require(auth[msg.sender] && !minted[msg.sender], "not authorized or already minted");
        tokenIndex++;
        _safeMint(msg.sender, tokenIndex);
        minted[msg.sender] = true;
        emit Claim(msg.sender, tokenIndex);
    }

    function transferFrom(address, address, uint256) public pure override {
        revert("not allowed");
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return uri;
    }
}
