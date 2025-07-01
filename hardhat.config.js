require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
      solidity: {
        version: "0.8.20", // Убедитесь, что это ваша текущая версия Solidity
        settings: {
            optimizer: {
                enabled: true,
                runs: 200 // Оптимизирует для 200 вызовов (хороший баланс)
            }
        }
    },
};
