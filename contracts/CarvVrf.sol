// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

import "./interfaces/ICarvVrf.sol";
import "./interfaces/ICarvVrfCallback.sol";

contract CarvVrf is VRFConsumerBaseV2Plus, ICarvVrf {
    struct VrfConfigData {
        bytes32 keyHash;
        uint64 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
    }

    VrfConfigData public vrfConfig;
    mapping(uint256 => address) public requestCaller;
    mapping(address => bool) public allowedCaller;

    event UpdateVrfConfig(VrfConfigData config);
    event GrantCaller(address caller);
    event RevokeCaller(address caller);

    constructor(address vrf_) VRFConsumerBaseV2Plus(vrf_) {}

    function updateVrfConfig(VrfConfigData calldata config) external onlyOwner {
        vrfConfig = config;
        emit UpdateVrfConfig(config);
    }

    function grantCaller(address caller) external onlyOwner {
        require(!allowedCaller[caller], "granted");
        allowedCaller[caller] = true;
        emit GrantCaller(caller);
    }

    function revokeCaller(address caller) external onlyOwner {
        require(allowedCaller[caller], "revoked");
        allowedCaller[caller] = false;
        emit RevokeCaller(caller);
    }

    function requestRandomWords() external onlyAllowed override returns (uint256) {
        uint256 requestID = VRFCoordinatorV2Interface(address(s_vrfCoordinator)).requestRandomWords(
            vrfConfig.keyHash,
            vrfConfig.subId,
            vrfConfig.requestConfirmations,
            vrfConfig.callbackGasLimit,
            vrfConfig.numWords
        );
        requestCaller[requestID] = msg.sender;
        return requestID;
    }

    // chainlink VRF callback function
    // According to random words, emit event to decide nodes verifying
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        ICarvVrfCallback(requestCaller[requestId]).fulfillRandomWords(requestId, randomWords);
    }

    modifier onlyAllowed() {
        require(allowedCaller[msg.sender], "not allowed");
        _;
    }
}
