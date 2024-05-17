// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface ICarvNft {

    /**
     * @notice This struct represents information When users redeem NFT by CARV payment,
     * @notice the CARV claim information is recorded in.
     *
     * `redeemer`: Redeemer of this tokenID
     * `amount`: Total amount of repaid CARVs
     * `claimed`: Amount of claimed CARVs
     * `redeemTimestamp`: Timestamp when redemption was initiated
     */
    struct ClaimInfo {
        address redeemer;
        uint256 amount;
        uint256 claimed;
        uint256 redeemTimestamp;
    }

    event Mint(address to, uint256 tokenID);

    event Redeem(uint256 tokenID, uint256 amount, bool withCarv);

    event Claim(uint256 tokenID, uint256 claimAmount);

    event ClaimBatch(uint256[] tokenIDs, uint256 claimAmount);

    /**
     * @notice mint nft (only address in whitelist).
     * @notice tokens paid by minters are stored in the vault contract
     * @notice totalSupply 100,000
     * @dev Emits `Mint`.
     */
    function mint() external;

    /**
     * @notice To redeem NFT, the following conditions need to be met:
     * @notice 1. The verification rewards corresponding to this tokenID have never been received.
     * @notice 2. At least 6 months have passed since mint this tokenID
     * @notice There are two ways to redeem:
     * @notice 1. by source token(like eth), 80% of the purchase price will be returned directly.
     * @notice 2. by CARV token, The redemption reward is released linearly and lasts for one month.
     * @notice    Users can claim it by themselves through claim().
     * @notice After redemption, all verification rewards corresponding to the tokenID will be cleared to zero.
     * @dev Emits `Redeem`.
     * @param tokenID: TokenID of which needs to be redeemed
     * @param withCarv: Indicates whether to accept CARV payment.
     */
    function redeem(uint256 tokenID, bool withCarv) external;

    /**
     * @notice To receive redemption reward by CARV token.
     * @notice You can only receive redemption reward by CARV token when withCarv is selected during redeem.
     * @notice The linear release lasts for one month.
     * @notice If it is more than one month before redemption, you can claim all of it.
     * @notice If it is less than one month, you can claim part of it.
     * @dev Emits `Claim`.
     * @param tokenID: TokenID needed to receive redemption reward by CARVs
     */
    function claim(uint256 tokenID) external;

    /**
     * @notice To receive redemption reward by CARV tokens (Batch).
     * @dev Emits `ClaimBatch`.
     * @param tokenIDs: TokenIDs needed to receive redemption reward by CARVs
     */
    function claimBatch(uint256[] calldata tokenIDs) external;
}
