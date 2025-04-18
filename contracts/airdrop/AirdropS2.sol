// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AirdropS2 is Ownable {
    bytes32 public merkleRoot;
    address public immutable token;
    mapping(address => bool) public claimed;

    event Claimed(address user, uint256 amount);
    event Deposit(address depositer, uint256 amount);
    event Withdraw(address withdrawer, uint256 amount);

    constructor(bytes32 merkleRoot_, address token_) Ownable(msg.sender) {
        require(token_ != address(0));
        merkleRoot = merkleRoot_;
        token = token_;
    }

    // deposit CARV token as airdrop reward
    function depositToken(uint256 amount) external {
        require(amount > 0, "invalid amount");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount);
    }

    // withdraw CARV token in this contract (only owner can do this)
    function withdrawToken(uint256 amount) external onlyOwner {
        require(amount > 0, "invalid amount");
        IERC20(token).transfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    function changeMerkleRoot(bytes32 merkleRoot_) external onlyOwner {
        merkleRoot = merkleRoot_;
    }

    function claim(uint256 amount, bytes32[] calldata merkleProof) external {
        require(!claimed[msg.sender], 'Drop already claimed');

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), 'Invalid proof');

        claimed[msg.sender] = true;
        IERC20(token).transfer(msg.sender, amount);
        emit Claimed(msg.sender, amount);
    }
}
