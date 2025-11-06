// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "./interfaces/IReputationRegistry.sol";
import "./interfaces/IIdentityRegistry.sol";

contract ReputationRegistry is IReputationRegistry {
    IIdentityRegistry public immutable identityRegistry;
    mapping(bytes32 => bool) private _feedbackAuthorizations;
    mapping(uint256 => mapping(uint256 => bytes32)) private _clientServerToAuthId;

    constructor(address _identityRegistry) {
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }

    function acceptFeedback(uint256 agentClientId, uint256 agentServerId) external {
        // Validate that both agents exist
        if (!identityRegistry.agentExists(agentClientId)) {
            revert AgentNotFound();
        }
        if (!identityRegistry.agentExists(agentServerId)) {
            revert AgentNotFound();
        }

        // Get server agent info to check authorization
        IIdentityRegistry.AgentInfo memory serverAgent = identityRegistry.getAgent(agentServerId);

        // Only the server agent can authorize feedback
        if (msg.sender != serverAgent.agentAddress) {
            revert UnauthorizedFeedback();
        }

        // Check if feedback is already authorized
        bytes32 existingAuthId = _clientServerToAuthId[agentClientId][agentServerId];
        if (existingAuthId != bytes32(0)) {
            revert FeedbackAlreadyAuthorized();
        }

        // Generate unique feedback authorization ID
        bytes32 feedbackAuthId = _generateFeedbackAuthId(agentClientId, agentServerId);

        // Store the authorization
        _feedbackAuthorizations[feedbackAuthId] = true;
        _clientServerToAuthId[agentClientId][agentServerId] = feedbackAuthId;

        emit AuthFeedback(agentClientId, agentServerId, feedbackAuthId);
    }

    function isFeedbackAuthorized(
        uint256 agentClientId,
        uint256 agentServerId
    ) external view returns (bool isAuthorized, bytes32 feedbackAuthId) {
        feedbackAuthId = _clientServerToAuthId[agentClientId][agentServerId];
        isAuthorized = feedbackAuthId != bytes32(0) && _feedbackAuthorizations[feedbackAuthId];
    }

    function getFeedbackAuthId(
        uint256 agentClientId,
        uint256 agentServerId
    ) external view returns (bytes32 feedbackAuthId) {
        feedbackAuthId = _clientServerToAuthId[agentClientId][agentServerId];
    }

    function _generateFeedbackAuthId(
        uint256 agentClientId,
        uint256 agentServerId
    ) private view returns (bytes32 feedbackAuthId) {
        // Include block timestamp and transaction hash for uniqueness
        feedbackAuthId = keccak256(
            abi.encodePacked(
                agentClientId,
                agentServerId,
                block.timestamp,
                block.prevrandao,
                tx.origin
            )
        );
    }
}