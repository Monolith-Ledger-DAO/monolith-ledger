// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MonolithGovernanceToken
 * @dev The governance token for the Monolith Ledger DAO.
 * Symbol: LITH
 * Total Supply: 100,000,000 tokens.
 * The supply is fixed and all tokens are minted to the contract deployer.
 * Supports voting and delegation for governance.
 */
contract MonolithGovernanceToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    constructor(address initialOwner)
        ERC20("MonolithGovernanceToken", "LITH")
        ERC20Permit("MonolithGovernanceToken")
        Ownable(initialOwner)
    {
        _mint(msg.sender, 100000000 * 10**decimals());
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
