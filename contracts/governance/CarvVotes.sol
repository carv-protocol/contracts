// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/Multicall.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract CarvVotes is ERC20Votes, ERC20Permit, AccessControl, Multicall {
    bytes32 public constant UPDATE_ROLE = keccak256("UPDATE_ROLE");

    error ERC20TransferForbidden();

    constructor(
        string memory _name,
        string memory _symbol,
        address defaultAdmin,
        address updater
    ) ERC20(_name, _symbol) ERC20Permit(_name) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(UPDATE_ROLE, updater);
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    function transfer(address, uint256) public pure override returns (bool) {
        revert ERC20TransferForbidden();
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert ERC20TransferForbidden();
    }

    function update(address from, address to, uint256 value) external onlyRole(UPDATE_ROLE) {
        _update(from, to, value);
    }

}

