// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NodeBuyback {
    enum PayoutOption {
        Immediate,
        LinearVesting
    }

    address public carvNft;
    address public redeemAddress;
    mapping(address => bool) public submitted;

    event Buyback(address user, uint256[] tokenIds, PayoutOption option);

    constructor(address carvNft_, address redeemAddress_) {
        require(redeemAddress_ != address(0) && carvNft_ != address(0), "address cannot be zero");
        carvNft = carvNft_;
        redeemAddress = redeemAddress_;
    }

    function buyback(uint256[] calldata tokenIds, PayoutOption option) external {
        require(!submitted[msg.sender], "already submitted");
        require(tokenIds.length > 0, "empty tokenIds");
        require(option == PayoutOption.Immediate || option == PayoutOption.LinearVesting, "unknown option");

        for (uint i = 0; i < tokenIds.length; i++) {
            IERC721(carvNft).transferFrom(msg.sender, redeemAddress, tokenIds[i]);
        }

        submitted[msg.sender] = true;
        emit Buyback(msg.sender, tokenIds, option);
    }
}

