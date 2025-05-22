// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IveCarvsView.sol";

contract StakingCampaign is ERC1155, Ownable {

    uint256 public constant BRONZE = 1;
    uint256 public constant SILVER = 2;
    uint256 public constant GOLD = 3;
    uint256 public constant PLATINUM = 4;

    uint32 public beginEpoch;
    uint32 public endEpoch;
    address public vecarvsAddress;

    mapping(uint256 => uint256) public minAmountRequirement;
    mapping(address => mapping(uint256 => bool)) public claimed;

    constructor(uint32 beginEpoch_, uint32 endEpoch_, address vecarvsAddress_) ERC1155("") Ownable(msg.sender) {
        minAmountRequirement[BRONZE] = 250e18;
        minAmountRequirement[SILVER] = 1000e18;
        minAmountRequirement[GOLD] = 2500e18;
        minAmountRequirement[PLATINUM] = 10000e18;
        beginEpoch = beginEpoch_;
        endEpoch = endEpoch_;
        vecarvsAddress = vecarvsAddress_;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function mint(uint256 id) external supportedID(id) {
        require(!claimed[msg.sender][id], "already claimed");
        require(highestAmount(msg.sender) >= minAmountRequirement[id], "not meet requirement");

        _mint(msg.sender, id, 1, "");
        claimed[msg.sender][id] = true;
    }

    function safeBalanceOfAt(address user, uint256 timestamp) internal view returns (uint256) {
        try IveCarvsView(vecarvsAddress).balanceOfAt(user, timestamp) returns (uint val) {
            return val;
        } catch {
            return 0;
        }
    }

    function highestAmount(address user) public view returns (uint256 amount) {
        for (uint32 index = beginEpoch; index <= endEpoch; index++) {
            if (index > IveCarvsView(vecarvsAddress).epoch()) {
                return amount;
            }

            uint256 currAmount = safeBalanceOfAt(user, IveCarvsView(vecarvsAddress).epochTimestamp(index));
            if (currAmount > amount) {
                amount = currAmount;
            }
        }
        return amount;
    }

    function safeTransferFrom(address, address, uint256, uint256, bytes memory) public pure override {
        revert("not allowed");
    }
    function safeBatchTransferFrom(
        address, address, uint256[] memory, uint256[] memory, bytes memory
    ) public pure override {
        revert("not allowed");
    }

    modifier supportedID(uint256 id) {
        require(id >= BRONZE && id <= PLATINUM, "unsupported id");
        _;
    }

}
