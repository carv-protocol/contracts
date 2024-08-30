// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

interface IVault {

    event FoundationWithdraw(address token, uint256 amount);

    event RewardsDeposit(uint256 amount);

    event RewardsWithdraw(address to, uint256 amount);

    event ChangeFoundation(address newFoundation);

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
     * @notice Rewards account Deposit, only foundation authority can operate
     * @notice Deposit veCARV(CARV -> veCARV) for verification rewards
     * @notice Define token release rules
     *
     * @dev Emits `RewardsDeposit`.
     */
    function rewardsDeposit(uint256 amount) external;

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

    function startTimestamp() external view returns (uint256);

    function totalRewardByDate(uint32 dateIndex) external pure returns (uint256);
}
