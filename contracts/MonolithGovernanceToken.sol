// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MonolithGovernanceToken
 * @dev The governance token for the Monolith Ledger DAO.
 * Symbol: LITH
 * Total Supply: 100,000,000 tokens.
 * The supply is fixed and all tokens are minted to the contract deployer.
 */
contract MonolithGovernanceToken is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("MonolithGovernanceToken", "LITH")
        Ownable(initialOwner)
    {
        _mint(msg.sender, 100000000 * 10**decimals());
    }
}