// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import "./interfaces/IIdentityRegistry.sol";

contract IdentityRegistry is IIdentityRegistry {
    uint256 public constant REGISTRATION_FEE = 0 ether;

    uint256 private _agentIdCounter;
    mapping(uint256 => AgentInfo) private _agents;
    mapping(string => uint256) private _domainToAgentId;
    mapping(address => uint256) private _addressToAgentId;

    constructor() {
        _agentIdCounter = 1;
    }

    function newAgent(
        string calldata agentDomain,
        address agentAddress
    ) external payable returns (uint256 agentId) {
        // Validate fee
        if (msg.value != REGISTRATION_FEE) {
            revert InsufficientFee();
        }

        // Validate inputs
        if (bytes(agentDomain).length == 0) {
            revert InvalidDomain();
        }
        if (agentAddress == address(0)) {
            revert InvalidAddress();
        }

        // Check for duplicates
        if (_domainToAgentId[agentDomain] != 0) {
            revert DomainAlreadyRegistered();
        }
        if (_addressToAgentId[agentAddress] != 0) {
            revert AddressAlreadyRegistered();
        }

        // Assign new agent ID
        agentId = _agentIdCounter++;

        // Store agent info
        _agents[agentId] = AgentInfo({
        agentId: agentId,
        agentDomain: agentDomain,
        agentAddress: agentAddress
        });

        // Create lookup mappings
        _domainToAgentId[agentDomain] = agentId;
        _addressToAgentId[agentAddress] = agentId;

        // Burn the registration fee by not forwarding it anywhere
        // The ETH stays locked in this contract forever

        emit AgentRegistered(agentId, agentDomain, agentAddress);
    }

    function updateAgent(
        uint256 agentId,
        string calldata newAgentDomain,
        address newAgentAddress
    ) external returns (bool success) {
        // Validate agent exists
        AgentInfo storage agent = _agents[agentId];
        if (agent.agentId == 0) {
            revert AgentNotFound();
        }

        // Check authorization
        if (msg.sender != agent.agentAddress) {
            revert UnauthorizedUpdate();
        }

        bool domainChanged = bytes(newAgentDomain).length > 0;
        bool addressChanged = newAgentAddress != address(0);

        // Validate new values if provided
        if (domainChanged) {
            if (_domainToAgentId[newAgentDomain] != 0) {
                revert DomainAlreadyRegistered();
            }
        }

        if (addressChanged) {
            if (_addressToAgentId[newAgentAddress] != 0) {
                revert AddressAlreadyRegistered();
            }
        }

        // Update domain if provided
        if (domainChanged) {
            // Remove old domain mapping
            delete _domainToAgentId[agent.agentDomain];
            // Set new domain
            agent.agentDomain = newAgentDomain;
            _domainToAgentId[newAgentDomain] = agentId;
        }

        // Update address if provided
        if (addressChanged) {
            // Remove old address mapping
            delete _addressToAgentId[agent.agentAddress];
            // Set new address
            agent.agentAddress = newAgentAddress;
            _addressToAgentId[newAgentAddress] = agentId;
        }

        emit AgentUpdated(agentId, agent.agentDomain, agent.agentAddress);
        return true;
    }

    function getAgent(uint256 agentId) external view returns (AgentInfo memory agentInfo) {
        agentInfo = _agents[agentId];
        if (agentInfo.agentId == 0) {
            revert AgentNotFound();
        }
    }

    function resolveByDomain(string calldata agentDomain) external view returns (AgentInfo memory agentInfo) {
        uint256 agentId = _domainToAgentId[agentDomain];
        if (agentId == 0) {
            revert AgentNotFound();
        }
        agentInfo = _agents[agentId];
    }

    function resolveByAddress(address agentAddress) external view returns (AgentInfo memory agentInfo) {
        uint256 agentId = _addressToAgentId[agentAddress];
        if (agentId == 0) {
            revert AgentNotFound();
        }
        agentInfo = _agents[agentId];
    }

    function getAgentCount() external view returns (uint256 count) {
        return _agentIdCounter - 1; // Subtract 1 because we start from 1
    }

    function agentExists(uint256 agentId) external view returns (bool exists) {
        return _agents[agentId].agentId != 0;
    }
}