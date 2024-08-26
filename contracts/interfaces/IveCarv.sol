// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

interface IveCarv {

    /**
     * @notice This struct represents information about a Withdraw by the user.
     *
     * `withdrawer`: address of who initiates this Withdraw.
     * `canceledOrClaimed`: Has this Withdraw been canceled or claimed?
     * `amount`: The amount of Withdraw initiated by the user.
     * `timestamp`: The time this Withdraw was initiated.
     */
    struct WithdrawInfo {
        address withdrawer;
        bool canceledOrClaimed;
        uint256 amount;
        uint256 timestamp;
    }

    event Deposit(address depositor, address receiver, uint256 amount);

    event Withdraw(uint64 indexed id, address withdrawer, uint256 amount);

    event CancelWithdraw(uint64 indexed id);

    event Claim(uint64 id, uint256 amount);

    event ClaimBatch(uint64[] ids, uint256 amount);

    /**
     * @notice convert CARV to veCARV by locking CARV in this contract and minting veCARV to msg.sender.
     * @notice CARV can be converted to veCARV with 1:1 ratio through deposit.
     * @notice veCARV stands for voting-escrow CARV, is a non-transferable token. veCARV is mainly used for:
     * @notice 1. CARV Protocol governance.
     * @notice 2. Incentive to bootstrap incentive layer, e.g., data owners, providers, consumers.
     * @notice 3. Used for governance voting in P2E system 'Infinite Play'.
     * @notice 4. Used in P2E systems to delegate voting rights to escrow pool owners and receive pool rewards.
     * @notice 5. Incentivizes node operators who secure and support the network.
     *
     * @dev Emits `Deposit`.
     *
     * @param amount: amount of CARV to be deposited
     * @param receiver: receiver of veCARV Token
     */
    function deposit(uint256 amount, address receiver) external;

    /**
     * @notice convert veCARV to CARV, veCARV conversion to CARV requires an unlocking period.
     * @notice The withdraw rate varies for different unlocking periods,
     * @notice with longer unlocking periods resulting in higher withdraw rates, reaching up to 100%.
     * @notice Users are required to pay a network channel fee of 1 CARV each time they initiate a Withdraw.
     *
     * @dev Emits `Withdraw`.
     *
     * @param amount: amount of veCARV to be withdrawn
     */
    function withdraw(uint256 amount) external;

    /**
     * @notice Cancel the Withdraw by withdrawID.
     * @notice It can be canceled before the user claims.
     * @notice After the operation, the locking veCARV is returned to msg.sender.
     *
     * @dev Emits `CancelWithdraw`.
     *
     * @param withdrawID: The withdrawID that the user needs to cancel
     */
    function cancelWithdraw(uint64 withdrawID) external;

    /**
     * @notice Return the CARV corresponding to the specified withdrawID to the user.
     * @notice The relationship between the user’s Locking Duration and claimable ratio is as follows:
     *    ----------------------------------------------------
     *    |   Locking Duration (Days)   |    Claims (CARV)   |
     *    |            15               |        25%         |
     *    |            90               |        60%         |
     *    |           150               |       100%         |
     *    ----------------------------------------------------
     * @notice after that, Burn the locking veCARV corresponding to the specified withdrawID
     * @notice If the Locking Duration is less than 150 days, the remaining CARV will be:
     * @notice 1. 50% enter the CARV foundation to maintain network operation.
     * @notice 2. 50% will be burned, which makes CARV deflationary.
     *
     * @dev Emits `Claim`.
     *
     * @param withdrawID: The withdrawID that the user needs to claim CARV
     */
    function claim(uint64 withdrawID) external;

    /**
     * @notice To claim CARV by withdrawIDs (Batch).
     *
     * @dev Emits `ClaimBatch`.
     *
     * @param withdrawIDs: The withdrawIDs that the user needs to claim CARV
     */
    function claimBatch(uint64[] calldata withdrawIDs) external;
}
