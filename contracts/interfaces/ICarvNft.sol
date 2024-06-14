// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface ICarvNft {
    /**
     * @notice mint {count} nft to {receiver}.
     * @notice totalSupply 100,000
     *
     * @dev Auth: Only Owner.
     *
     * @param receiver: nft receiver
     * @param count: how many nft to be minted to receiver
     */
    function mint(address receiver, uint256 count) external;

    /**
     * @notice mint {counts} nft to {receivers}.
     * @notice call `mint`
     *
     * @dev Auth: Only Owner.
     *
     * @param receivers: array of receivers
     * @param counts: array of counts
     */
    function mintBatch(address[] calldata receivers, uint256[] calldata counts) external;

    /**
     * @notice Set tokenURI of all the tokens
     * @notice The URI of each tokenID is the same
     *
     * @dev Auth: Only Owner.
     *
     * @param newTokenURI: newTokenURI
     */
    function setTokenURI(string memory newTokenURI) external;

    /**
     * @notice Set TransferProhibitedUntil
     * @notice When the time has not reached the `TransferProhibitedUntil`, ordinary tokens cannot be transferred.
     *
     * @dev Auth: Only Owner.
     *
     * @param newTransferProhibitedUntil: newTransferProhibitedUntil
     */
    function setTransferProhibitedUntil(uint256 newTransferProhibitedUntil) external;

    /**
     * @notice Set RedeemAddress
     * @notice When `transfer.to` is RedeemAddress, the token can be transferred under any circumstances
     *
     * @dev Auth: Only Owner.
     *
     * @param newRedeemAddress: newRedeemAddress
     */
    function setRedeemAddress(address newRedeemAddress) external;

    /**
     * @notice Set TransferOnceWhitelist
     * @notice Addresses in the whitelist can transfer tokens once before `TransferProhibitedUntil`
     *
     * @dev Auth: Only Owner.
     *
     * @param whitelist: whitelist
     */
    function setTransferOnceWhitelist(address[] calldata whitelist) external;
}
