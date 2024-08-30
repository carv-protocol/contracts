// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Adminable is Initializable {
    address public admin;
    mapping(address => bool) public teeRoles;
    mapping(address => bool) public slashRoles;

    event ModifyTeeRole(address tee, bool grant);
    event ModifySlashRole(address slasher, bool grant);
    event ModifyAdmin(address newAdmin);

    function __Adminable_init(address admin_) internal onlyInitializing {
        admin = admin_;
    }

    function modifyTeeRole(address tee, bool grant) external onlyAdmin {
        teeRoles[tee] = grant;
        emit ModifyTeeRole(tee, grant);
    }

    function modifySlashRole(address slasher, bool grant) external onlyAdmin {
        slashRoles[slasher] = grant;
        emit ModifySlashRole(slasher, grant);
    }

    function modifyAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
        emit ModifyAdmin(newAdmin);
    }

    modifier onlyTee() {
        require(teeRoles[msg.sender], "Not tee");
        _;
    }

    modifier onlySlasher() {
        require(slashRoles[msg.sender], "Not slasher");
        _;
    }

    modifier onlyAdmin() {
        require(admin == msg.sender, "Not admin");
        _;
    }
}
