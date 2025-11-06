// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

interface IIdentityRegistry {
    event AgentRegistered(uint256 indexed agentId, string agentDomain, address agentAddress);

    event AgentUpdated(uint256 indexed agentId, string agentDomain, address agentAddress);

    struct AgentInfo {
        uint256 agentId;
        string agentDomain;
        address agentAddress;
    }

    error AgentNotFound();
    error UnauthorizedUpdate();
    error InvalidDomain();
    error InvalidAddress();
    error InsufficientFee();
    error DomainAlreadyRegistered();
    error AddressAlreadyRegistered();

    function newAgent(string calldata agentDomain, address agentAddress) external payable returns (uint256 agentId);

    function updateAgent(
        uint256 agentId,
        string calldata newAgentDomain,
        address newAgentAddress
    ) external returns (bool success);

    function getAgent(uint256 agentId) external view returns (AgentInfo memory agentInfo);

    function resolveByDomain(string calldata agentDomain) external view returns (AgentInfo memory agentInfo);

    function resolveByAddress(address agentAddress) external view returns (AgentInfo memory agentInfo);

    function getAgentCount() external view returns (uint256 count);

    function agentExists(uint256 agentId) external view returns (bool exists);

    function REGISTRATION_FEE() external pure returns (uint256 fee);
}