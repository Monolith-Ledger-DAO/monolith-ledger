// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "./MonolithGovernanceToken.sol";

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
    GovernorTimelockControl
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
        uint256 _initialVotingDelay,
        uint256 _initialVotingPeriod,
        uint256 _initialProposalThreshold,
        uint256 _initialQuorumFraction
    )
        Governor("MonolithLedgerDAO")
        GovernorSettings(_initialVotingDelay, _initialVotingPeriod, _initialProposalThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_initialQuorumFraction)
        GovernorTimelockControl(_timelock)
    {}

    // The following functions are overrides required by Solidity.

    function votingDelay() public view override(IVotes, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(IVotes, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }
}