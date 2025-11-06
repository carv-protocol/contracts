// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

interface IReputationRegistry {
    event AuthFeedback(
        uint256 indexed agentClientId,
        uint256 indexed agentServerId,
        bytes32 indexed feedbackAuthId
    );

    error AgentNotFound();
    error UnauthorizedFeedback();
    error FeedbackAlreadyAuthorized();
    error InvalidAgentId();

    function acceptFeedback(uint256 agentClientId, uint256 agentServerId) external;

    function isFeedbackAuthorized(
        uint256 agentClientId,
        uint256 agentServerId
    ) external view returns (bool isAuthorized, bytes32 feedbackAuthId);

    function getFeedbackAuthId(
        uint256 agentClientId,
        uint256 agentServerId
    ) external view returns (bytes32 feedbackAuthId);
}