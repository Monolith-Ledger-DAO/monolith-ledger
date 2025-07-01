// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MonolithLedgerDAO
 * @dev The main DAO contract that governs the Monolith Ledger ecosystem.
 * It handles proposals, voting, and execution.
 */
contract MonolithLedgerDAO is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    Ownable
{
    /**
     * @dev Constructor to set up the DAO with initial settings.
     * @param _token The address of the LITH governance token.
     * @param _timelock The address of the Timelock contract, which adds a delay to executed proposals.
     * @param _initialVotingDelay The delay before a vote on a proposal starts (in blocks).
     * @param _initialVotingPeriod The duration of the voting period (in blocks).
     * @param _initialProposalThreshold The minimum number of tokens required to create a proposal.
     * @param _initialQuorumFraction The percentage of total tokens that must vote for a proposal to be valid.
     */
    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint48 _initialVotingDelay, // Changed from uint256
        uint32 _initialVotingPeriod, // Changed from uint256
        uint256 _initialProposalThreshold,
        uint256 _initialQuorumFraction
    )
        Governor("MonolithLedgerDAO")
        GovernorSettings(_initialVotingDelay, _initialVotingPeriod, _initialProposalThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_initialQuorumFraction)
        GovernorTimelockControl(_timelock)
        Ownable(msg.sender)
    {}

    // The following functions are overrides required by Solidity.

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function quorum(uint256 blockNumber) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    // --- Overrides to resolve conflicts with GovernorTimelockControl ---

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return GovernorTimelockControl.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return GovernorTimelockControl.proposalNeedsQueuing(proposalId);
    }

    function _executor() internal view virtual override(Governor, GovernorTimelockControl) returns (address) {
        return GovernorTimelockControl._executor();
    }

    // GovernorTimelockControl._cancel expects 4 arguments.
    // This overrides the conflicting _cancel functions.
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override(Governor, GovernorTimelockControl) returns (uint256) {
        return GovernorTimelockControl._cancel(targets, values, calldatas, descriptionHash);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override(Governor, GovernorTimelockControl) returns (uint48) {
        return GovernorTimelockControl._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override(Governor, GovernorTimelockControl) {
        GovernorTimelockControl._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

}
