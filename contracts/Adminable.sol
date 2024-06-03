// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Adminable is Initializable {
    address public admin;
    mapping(address => bool) public teeRoles;

    function __Adminable_init(address admin_) internal onlyInitializing {
        admin = admin_;
    }

    function modifyTeeRole(address tee, bool grant) external onlyAdmin {
        teeRoles[tee] = grant;
    }

    function modifyAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
    }

    modifier onlyTee() {
        require(teeRoles[msg.sender], "Not tee");
        _;
    }

    modifier onlyAdmin() {
        require(admin == msg.sender, "Not admin");
        _;
    }
}
