const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Monolith Ledger DAO Deployment and Integration", function () {
    let owner, addr1;
    let lith;
    let mle;
    let timelock;
    let dao;

    before(async function () {
        [owner, addr1] = await ethers.getSigners();

        // 1. Deploy LITH Token
        const MonolithGovernanceToken = await ethers.getContractFactory("MonolithGovernanceToken");
        lith = await MonolithGovernanceToken.deploy(owner.address);
        await lith.waitForDeployment();
        console.log(`LITH Token deployed to: ${await lith.getAddress()}`);

        // 2. Deploy MLE Token
        const MonolithAssetToken = await ethers.getContractFactory("MonolithAssetToken");
        mle = await MonolithAssetToken.deploy(owner.address);
        await mle.waitForDeployment();
        console.log(`MLE Token deployed to: ${await mle.getAddress()}`);
        
        // 3. Deploy Timelock
        const MIN_DELAY = 3600; // 1 hour in seconds
        const TimelockController = await ethers.getContractFactory("TimelockController");
        timelock = await TimelockController.deploy(MIN_DELAY, [owner.address], [owner.address], owner.address);
        await timelock.waitForDeployment();
        console.log(`Timelock deployed to: ${await timelock.getAddress()}`);

        // 4. Deploy the main DAO contract with the CORRECT 6 arguments
        const MonolithLedgerDAO = await ethers.getContractFactory("MonolithLedgerDAO");
        dao = await MonolithLedgerDAO.deploy(
            await lith.getAddress(),    // IVotes _token
            await timelock.getAddress(),// TimelockController _timelock
            300,                        // uint48 _initialVotingDelay
            20160,                      // uint32 _initialVotingPeriod
            0,                          // uint256 _initialProposalThreshold
            4                           // uint256 _initialQuorumFraction
        );
        await dao.waitForDeployment();
        console.log(`DAO deployed to: ${await dao.getAddress()}`);

        // 5. Delegate voting power to enable governance
        await lith.delegate(owner.address);
        console.log(`Voting power delegated to owner`);
    });

    it("Should successfully deploy all contracts", async function () {
        expect(await lith.getAddress()).to.not.be.null;
        expect(await mle.getAddress()).to.not.be.null;
        expect(await timelock.getAddress()).to.not.be.null;
        expect(await dao.getAddress()).to.not.be.null;
    });

    it("Should set up roles and ownership correctly", async function () {
        const daoAddress = await dao.getAddress();
        const timelockAddress = await timelock.getAddress();
        
        const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
        const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
        const DEFAULT_ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE(); 

        await timelock.grantRole(PROPOSER_ROLE, daoAddress);
        await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
        await timelock.revokeRole(DEFAULT_ADMIN_ROLE, owner.address);

        await dao.transferOwnership(timelockAddress);
        await mle.transferOwnership(daoAddress); 

        expect(await dao.owner()).to.equal(timelockAddress);
        expect(await mle.owner()).to.equal(daoAddress);
    });
});
