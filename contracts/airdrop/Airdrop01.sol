// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IveCarvs.sol";
import "../interfaces/ISBT.sol";

contract Airdrop01 is Ownable {
    bytes32 public merkleRoot;
    address public carv;
    address public veCarvs;
    address public sbt;
    mapping(address => bool) public claimed;

    event Claimed(address user, uint256 amount);
    event ClaimedForStaking(address user, uint256 amount, uint256 duration);
    event Deposit(address depositer, uint256 amount);
    event Withdraw(address withdrawer, uint256 amount);

    constructor(bytes32 merkleRoot_, address carv_, address veCarvs_, address sbt_) Ownable(msg.sender) {
        merkleRoot = merkleRoot_;
        carv = carv_;
        veCarvs = veCarvs_;
        sbt = sbt_;
        IERC20(carv).approve(veCarvs_, type(uint256).max);
    }

    // deposit CARV token as airdrop reward
    function depositToken(uint256 amount) external {
        require(amount > 0, "invalid amount");
        IERC20(carv).transferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount);
    }

    // withdraw CARV token in this contract (only owner can do this)
    function withdrawToken(uint256 amount) external onlyOwner {
        require(amount > 0, "invalid amount");
        IERC20(carv).transfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    function changeMerkleRoot(bytes32 merkleRoot_) external onlyOwner {
        merkleRoot = merkleRoot_;
    }

    function claim(uint256 amount, bytes32[] calldata merkleProof) external {
        checkMerkleProof(amount, merkleProof);
        IERC20(carv).transfer(msg.sender, amount);
        emit Claimed(msg.sender, amount);
    }

    function claimForStaking(uint256 amount, uint256 duration, bytes32[] calldata merkleProof) external {
        checkMerkleProof(amount, merkleProof);
        IveCarvs(veCarvs).depositForSpecial(msg.sender, amount, duration);
        ISBT(sbt).authorize(msg.sender);
        emit ClaimedForStaking(msg.sender, amount, duration);
    }

    function checkMerkleProof(uint256 amount, bytes32[] calldata merkleProof) internal {
        require(!claimed[msg.sender], 'Drop already claimed');
        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), 'Invalid proof');

        claimed[msg.sender] = true;
    }
}
