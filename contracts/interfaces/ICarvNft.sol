// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface ICarvNft {
    /**
     * @notice This struct represents meta information bound to TokenID,
     *
     * `code`: code of this token entered by buyer
     * `price`: price of this token paid by buyer
     * `tier`: tier of this token
     */
    struct MetaData {
        string code;
        uint64 price;
        uint8 tier;
    }

    /**
     * @notice mint {count} nft to {receiver}.
     * @notice totalSupply 100,000
     *
     * @dev Auth: Only Owner.
     *
     * @param receiver: nft receiver
     * @param count: how many nft to be minted to receiver
     * @param meta: `MetaData` of this tokenID
     */
    function mint(address receiver, uint256 count, MetaData calldata meta) external;

    /**
     * @notice mint {counts} nft to {receivers}.
     * @notice call `mint`
     *
     * @dev Auth: Only Owner.
     *
     * @param receivers: array of receivers
     * @param counts: array of counts
     * @param metas: array of meta
     */
    function mintBatch(address[] calldata receivers, uint256[] calldata counts, MetaData[] calldata metas) external;

    /**
     * @notice Set BaseURI of all the tokens
     *
     * @dev Auth: Only Owner.
     *
     * @param newBaseURI: newBaseURI
     */
    function setBaseURI(string memory newBaseURI) external;

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
     * @notice Set RedeemProhibitedUntil
     * @notice When the time has not reached the `RedeemProhibitedUntil`, ordinary tokens cannot be redeemed.
     *
     * @dev Auth: Only Owner.
     *
     * @param newRedeemProhibitedUntil: newRedeemProhibitedUntil
     */
    function setRedeemProhibitedUntil(uint256 newRedeemProhibitedUntil) external;

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
