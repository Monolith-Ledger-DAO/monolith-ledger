// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MonolithAssetToken
 * @dev Represents a share in the Monolith Ledger real estate portfolio.
 * Symbol: MLE
 * The supply is elastic and new tokens can only be minted by the owner (the DAO).
 */
contract MonolithAssetToken is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("MonolithAssetToken", "MLE")
        Ownable(initialOwner)
    {}

    /**
     * @dev Creates new tokens. Can only be called by the contract owner.
     * This function will be called by the main DAO contract upon successful
     * funding of a new real estate asset.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Destroys tokens. Can only be called by the contract owner.
     * This function can be used when an asset is sold and the
     * corresponding shares need to be removed from circulation.
     * @param from The address whose tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}