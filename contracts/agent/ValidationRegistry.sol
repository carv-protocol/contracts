// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "./interfaces/IValidationRegistry.sol";
import "./interfaces/IIdentityRegistry.sol";

contract ValidationRegistry is IValidationRegistry {
    uint256 public constant EXPIRATION_SLOTS = 1000;

    IIdentityRegistry public immutable identityRegistry;
    mapping(bytes32 => IValidationRegistry.Request) private _validationRequests;
    mapping(bytes32 => uint8) private _validationResponses;
    mapping(bytes32 => bool) private _hasResponse;

    constructor(address _identityRegistry) {
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }

    function validationRequest(
        uint256 agentValidatorId,
        uint256 agentServerId,
        bytes32 dataHash
    ) external {
        // Validate inputs
        if (dataHash == bytes32(0)) {
            revert InvalidDataHash();
        }

        // Validate that both agents exist
        if (!identityRegistry.agentExists(agentValidatorId)) {
            revert AgentNotFound();
        }
        if (!identityRegistry.agentExists(agentServerId)) {
            revert AgentNotFound();
        }

        // Check if request already exists and is still valid
        IValidationRegistry.Request storage existingRequest = _validationRequests[dataHash];
        if (existingRequest.dataHash != bytes32(0)) {
            if (block.number <= existingRequest.timestamp + EXPIRATION_SLOTS) {
                // Request still exists and is valid, just emit the event again
                emit ValidationRequestEvent(agentValidatorId, agentServerId, dataHash);
                return;
            }
        }

        // Create new validation request
        _validationRequests[dataHash] = IValidationRegistry.Request({
        agentValidatorId: agentValidatorId,
        agentServerId: agentServerId,
        dataHash: dataHash,
        timestamp: block.number,
        responded: false
        });

        emit ValidationRequestEvent(agentValidatorId, agentServerId, dataHash);
    }

    function validationResponse(bytes32 dataHash, uint8 response) external {
        // Validate response range (0-100)
        if (response > 100) {
            revert InvalidResponse();
        }

        // Get the validation request
        IValidationRegistry.Request storage request = _validationRequests[dataHash];

        // Check if request exists
        if (request.dataHash == bytes32(0)) {
            revert ValidationRequestNotFound();
        }

        // Check if request has expired
        if (block.number > request.timestamp + EXPIRATION_SLOTS) {
            revert RequestExpired();
        }

        // Check if already responded
        if (request.responded) {
            revert ValidationAlreadyResponded();
        }

        // Get validator agent info to check authorization
        IIdentityRegistry.AgentInfo memory validatorAgent = identityRegistry.getAgent(request.agentValidatorId);

        // Only the designated validator can respond
        if (msg.sender != validatorAgent.agentAddress) {
            revert UnauthorizedValidator();
        }

        // Mark as responded and store the response
        request.responded = true;
        _validationResponses[dataHash] = response;
        _hasResponse[dataHash] = true;

        emit ValidationResponseEvent(request.agentValidatorId, request.agentServerId, dataHash, response);
    }

    function getValidationRequest(bytes32 dataHash) external view returns (IValidationRegistry.Request memory request) {
        request = _validationRequests[dataHash];
        if (request.dataHash == bytes32(0)) {
            revert ValidationRequestNotFound();
        }
    }

    function isValidationPending(bytes32 dataHash) external view returns (bool exists, bool pending) {
        IValidationRegistry.Request storage request = _validationRequests[dataHash];
        exists = request.dataHash != bytes32(0);

        if (exists) {
            // Check if not expired and not responded
            bool expired = block.number > request.timestamp + EXPIRATION_SLOTS;
            pending = !expired && !request.responded;
        }
    }

    function getValidationResponse(bytes32 dataHash) external view returns (bool hasResponse, uint8 response) {
        hasResponse = _hasResponse[dataHash];
        if (hasResponse) {
            response = _validationResponses[dataHash];
        }
    }

    function getExpirationSlots() external pure returns (uint256 slots) {
        return EXPIRATION_SLOTS;
    }
}