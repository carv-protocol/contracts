require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("hardhat-gas-reporter");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
    gasReporter: {
      enabled: true,
    },
  },

  networks: {
    opbnb: {
      url: process.env.API_KEY_URL_OPBNB,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 1000000,
    },
    arb: {
      url: process.env.API_KEY_URL_ARB,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 100000000,
    },
    opbnb_nft: {
      url: process.env.API_KEY_URL_OPBNB,
      accounts: [process.env.NFT_PRIVATE_KEY],
      gasPrice: 1000000,
    },
    arb_nft: {
      url: process.env.API_KEY_URL_ARB_ONE,
      accounts: [process.env.ARB_NFT_PRIVATE_KEY],
      gasPrice: 15000000,
    }
  }
};
