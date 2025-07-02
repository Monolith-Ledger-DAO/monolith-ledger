const hre = require("hardhat");

async function main() {
  console.log("Setting up DAO roles and ownership...");

  // Получаем адреса развернутых контрактов
  const deploymentResult = await hre.ignition.deploy(require("../ignition/modules/MonolithLedger.js"));
  
  const { dao, governanceToken, assetToken, timelock } = deploymentResult;
  
  console.log("Contract addresses:");
  console.log("DAO:", await dao.getAddress());
  console.log("Governance Token:", await governanceToken.getAddress());
  console.log("Asset Token:", await assetToken.getAddress());
  console.log("Timelock:", await timelock.getAddress());

  // Получаем хэши ролей
  const PROPOSER_ROLE = "0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1";
  const EXECUTOR_ROLE = "0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63";
  const TIMELOCK_ADMIN_ROLE = "0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5";

  // Получаем signer (деплоер)
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  try {
    // 1. Назначаем роль PROPOSER DAO
    console.log("Granting PROPOSER_ROLE to DAO...");
    const tx1 = await timelock.grantRole(PROPOSER_ROLE, await dao.getAddress());
    await tx1.wait();
    console.log("✓ PROPOSER_ROLE granted to DAO");

    // 2. Назначаем роль EXECUTOR всем (0x0)
    console.log("Granting EXECUTOR_ROLE to everyone...");
    const tx2 = await timelock.grantRole(EXECUTOR_ROLE, "0x0000000000000000000000000000000000000000");
    await tx2.wait();
    console.log("✓ EXECUTOR_ROLE granted to everyone");

    // 3. Отзываем роль TIMELOCK_ADMIN у деплоера
    console.log("Revoking TIMELOCK_ADMIN_ROLE from deployer...");
    const tx3 = await timelock.revokeRole(TIMELOCK_ADMIN_ROLE, deployer.address);
    await tx3.wait();
    console.log("✓ TIMELOCK_ADMIN_ROLE revoked from deployer");

    // 4. Передаем владение DAO контракта Timelock
    console.log("Transferring DAO ownership to Timelock...");
    const tx4 = await dao.transferOwnership(await timelock.getAddress());
    await tx4.wait();
    console.log("✓ DAO ownership transferred to Timelock");

    // 5. Передаем владение Asset Token контракта DAO
    console.log("Transferring Asset Token ownership to DAO...");
    const tx5 = await assetToken.transferOwnership(await dao.getAddress());
    await tx5.wait();
    console.log("✓ Asset Token ownership transferred to DAO");

    console.log("\n🎉 DAO setup completed successfully!");
    console.log("\nFinal state:");
    console.log("- DAO is owned by Timelock");
    console.log("- Asset Token is owned by DAO");
    console.log("- Timelock has no admin (fully decentralized)");
    console.log("- DAO can propose through Timelock");
    console.log("- Anyone can execute approved proposals");

  } catch (error) {
    console.error("Error during setup:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
