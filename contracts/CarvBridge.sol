// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IOFT, SendParam, OFTReceipt, MessagingFee, MessagingReceipt } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

contract CarvBridge is Ownable {
    // feeRate = feeBPS / 1,000,000
    // 1000 feeBPS means feeRate is 0.1%
    uint256 public feeBPS;
    address public vault;
    address public oft;
    mapping(uint32 => bool) public supportedDstEid;

    event UpdateFeeBPS(address indexed sender, uint256 feeBPS);
    event UpdateVault(address indexed sender, address vault);
    event UpdateOft(address indexed sender, address oft);
    event UpdateSupportedDstEid(address indexed sender, uint256 dstEid);
    event Sent(bytes32 indexed guid, address indexed fromAddress, uint32 dstEid, uint256 amount);

    constructor(uint256 _feeBPS, address _vault, address _oft) Ownable(msg.sender) {
        feeBPS = _feeBPS;
        vault = _vault;
        oft = _oft;
    }

    function quoteSend(uint32 dstEid, uint256 amount) public view returns (uint256) {
        require(supportedDstEid[dstEid], "unsupported dstEid");

        SendParam memory sendParam = SendParam({
            dstEid: dstEid,
            to: bytes32(uint256(uint160(msg.sender))),
            amountLD: amount,
            minAmountLD: amount,
            extraOptions: bytes(""),
            composeMsg: bytes(""),
            oftCmd: bytes("")
        });

        MessagingFee memory messageFee = IOFT(oft).quoteSend(sendParam, false);

        return messageFee.nativeFee;
    }

    function send(uint32 dstEid, uint256 amount) public payable {
        require(supportedDstEid[dstEid], "unsupported dstEid");
        require(IERC20(oft).allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");

        uint256 fee = amount * feeBPS / 1000000;
        uint256 amountDeductFee = amount - fee;

        IERC20(oft).transferFrom(msg.sender, address(this), amount);
        IERC20(oft).transfer(vault, fee);

        SendParam memory sendParam = SendParam({
            dstEid: dstEid,
            to: bytes32(uint256(uint160(msg.sender))),
            amountLD: amountDeductFee,
            minAmountLD: amountDeductFee,
            extraOptions: bytes(""),
            composeMsg: bytes(""),
            oftCmd: bytes("")
        });

        MessagingFee memory messageFee = MessagingFee({
            nativeFee: msg.value,
            lzTokenFee: 0
        });

        (MessagingReceipt memory messagingReceipt, ) = IOFT(oft).send{value: msg.value}(sendParam, messageFee, msg.sender);

        emit Sent(messagingReceipt.guid, msg.sender, dstEid, amount);
    }

    function updateFeeBPS(uint256 _feeBPS) public onlyOwner {
        feeBPS = _feeBPS;
        emit UpdateFeeBPS(msg.sender,_feeBPS);
    }

    function updateVault(address _vault) public onlyOwner {
        vault = _vault;
        emit UpdateVault(msg.sender,_vault);
    }

    function updateOft(address _oft) public onlyOwner {
        oft = _oft;
        emit UpdateOft(msg.sender,_oft);
    }

    function updateSupportedDstEid(uint32 dstEid) public onlyOwner {
        supportedDstEid[dstEid] = true;
        emit UpdateSupportedDstEid(msg.sender, dstEid);
    }
}
