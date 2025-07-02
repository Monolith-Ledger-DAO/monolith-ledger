const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MonolithLedgerModule", (m) => {
  // Получаем адрес деплоера
  const deployer = m.getAccount(0);

  // Развертываем TimelockController из OpenZeppelin
  const MIN_DELAY = 3600; // 1 час (в секундах)
  const timelock = m.contract("TimelockController", [
    MIN_DELAY,
    [], // Proposers: на старте никто, эту роль получит DAO
    [], // Executors: на старте никто, эту роль получат все (0x0..0)
    deployer, // Admin: на старте админ - деплоер, чтобы настроить роли
  ], { 
    id: "TimelockController"
  });

  // Развертываем токены
  const governanceToken = m.contract("MonolithGovernanceToken", [deployer], { id: "GovernanceToken" });
  const assetToken = m.contract("MonolithAssetToken", [deployer], { id: "AssetToken" });

  // Развертываем DAO
  const dao = m.contract("MonolithLedgerDAO", [
    governanceToken, // _token
    timelock,        // _timelock
    300,             // _initialVotingDelay (~1 час для L2)
    20160,           // _initialVotingPeriod (~1 день для L2)
    0,               // _initialProposalThreshold
    4,               // _initialQuorumFraction (4%)
  ], { id: "DAO" });

  return { dao, governanceToken, assetToken, timelock };
});
