// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

interface IValidationRegistry {

    event ValidationRequestEvent(
        uint256 indexed agentValidatorId,
        uint256 indexed agentServerId,
        bytes32 indexed dataHash
    );

    event ValidationResponseEvent(
        uint256 indexed agentValidatorId,
        uint256 indexed agentServerId,
        bytes32 indexed dataHash,
        uint8 response
    );

    struct Request {
        uint256 agentValidatorId;
        uint256 agentServerId;
        bytes32 dataHash;
        uint256 timestamp;
        bool responded;
    }

    error AgentNotFound();
    error ValidationRequestNotFound();
    error ValidationAlreadyResponded();
    error UnauthorizedValidator();
    error RequestExpired();
    error InvalidResponse();
    error InvalidDataHash();

    function validationRequest(
        uint256 agentValidatorId,
        uint256 agentServerId,
        bytes32 dataHash
    ) external;

    function validationResponse(bytes32 dataHash, uint8 response) external;

    function getValidationRequest(bytes32 dataHash) external view returns (Request memory request);

    function isValidationPending(bytes32 dataHash) external view returns (bool exists, bool pending);

    function getValidationResponse(bytes32 dataHash) external view returns (bool hasResponse, uint8 response);

    function getExpirationSlots() external view returns (uint256 slots);
}