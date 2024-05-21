// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IVault {

    event FoundationWithdraw(address token, uint256 amount);

    event NftDeposit(uint256 amount);

    event NftWithdraw(uint256 amount, bool withCarv);

    event TeeDeposit(uint256 amount);

    event TeeWithdraw(address to, uint256 amount);

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
     * @notice Deposit tee staked CARV to Vault contract (convert to veCARV).
     * @notice Only tee authority can operate
     *
     * @dev Emits `TeeDeposit`.
     */
    function teeDeposit(uint256 amount) external;

    /**
     * @notice Called by ProtocolService contract when tee unstakes or verifier claims tee rewards.
     * @notice transfer veCARV to receiver.
     *
     * @dev Emits `TeeWithdraw`.
     *
     * @param receiver: address who to receive veCARV.
     * @param amount: amount of veCARV transferred to receiver.
     */
    function teeWithdraw(address receiver, uint256 amount) external;

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

    /**
     * @notice Change the address of aggregator.
     * @notice can only be operated by foundation authority
     *
     * @dev Emits `UpdateAggregator`.
     *
     * @param carvAggregator_: address of aggregator(carv/eth).
     */
    function updateAggregatorAddress(address carvAggregator_) external;

    function oracle(uint256 ethAmount) external view returns (uint256 carvAmount);

    function startTimestamp() external pure returns (uint256);

    function totalRewardByDate(uint32 dateIndex) external pure returns (uint256);
}
