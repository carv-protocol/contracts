// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IVault {

    event FoundationWithdraw(address token, uint256 amount);

    event NftDeposit(uint256 value);

    event NftWithdraw(uint256 value, bool withCarv);

    event RewardsInit();

    event RewardsWithdraw();

    event ChangeFoundation(address newFoundation);

    event UpdateAggregator(address aggregator);

    /**
     * @notice Withdraw token by foundation: by specifying the token address and amount.
     * @notice Foundation authorities can only withdraw token from their own accounts and cannot operate locked assets.
     *
     * @dev Emits `FoundationWithdraw`.
     *
     * @param token: address of withdraw token, nil address is the source token(like eth)
     * @param amount: amount of withdraw token
     */
    function foundationWithdraw(address token, uint256 amount) external;

    /**
     * @notice Deposit minter-paid ETH to Vault contract
     * @notice Only foundation authority can operate
     *
     * @dev Emits `NftDeposit`.
     */
    function nftDeposit(uint256 count) external payable;

    /**
     * @notice Called by CarvNft contract when users redeem nft.
     * @notice eth will pay back to user or exchange for CARV to pay back (exchange with the foundation)
     * @notice The exchange rate between CARV and eth will be obtained from chainlink
     *
     * @dev Emits `NftWithdraw`.
     *
     * @param withCarv: whether to pay back with CARV (if not, use eth).
     */
    function nftWithdraw(bool withCarv) external returns (uint256 amount);

    /**
     * @notice Rewards account initialization, only foundation authority can operate
     * @notice Deposit all veCARV(CARV -> veCARV) for verification rewards
     * @notice Define token release rules
     *
     * @dev Emits `RewardsInit`.
     */
    function rewardsInit() external;

    /**
     * @notice Called by ServiceProtocol contract, used to issue rewards to nodes or NFT holders.
     * @notice Strictly follow the release rules and do not release beyond the rules.
     *
     * @dev Emits `RewardsWithdraw`.
     *
     * @param receiver: address to receive rewards
     * @param amount: amount of rewards
     */
    function rewardsWithdraw(address receiver, uint256 amount) external;

    /**
     * @notice Change the address of foundation.
     * @notice can only be operated by foundation authority
     *
     * @dev Emits `ChangeFoundation`.
     *
     * @param newFoundation: address of new foundation.
     */
    function changeFoundation(address newFoundation) external;

    function updateAggregatorAddress(address carvAggregator_) external;

    function oracle(uint256 ethAmount) external view returns (uint256 carvAmount);
}
