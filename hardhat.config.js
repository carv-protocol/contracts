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
    opbnb_testnet: {
      url: process.env.API_KEY_URL_OPBNB_TESTNET,
      accounts: [process.env.TEST_PRIVATE_KEY],
      gasPrice: 1000000,
    },
    opbnb: {
      url: process.env.API_KEY_URL_OPBNB,
      accounts: [process.env.TEST_PRIVATE_KEY],
      gasPrice: 1000000,
    },
    arb_testnet: {
      url: process.env.API_KEY_URL_ARB_SEPOLIA,
      accounts: [process.env.TEST_PRIVATE_KEY],
      gasPrice: 150000000,
    },
    arb_nft: {
      url: process.env.API_KEY_URL_ARB_ONE,
      accounts: [process.env.ARB_NFT_PRIVATE_KEY],
      gasPrice: 15000000,
    },
    arb_oft: {
      url: process.env.API_KEY_URL_ARB_ONE,
      accounts: [process.env.OFT_PRIVATE_KEY],
      gasPrice: 15000000,
    },
    eth_oft: {
      url: process.env.API_KEY_URL_ETH_MAINNET,
      accounts: [process.env.OFT_PRIVATE_KEY],
      gasPrice: 12000000000,
    },
    base_testnet: {
      url: process.env.API_KEY_URL_BASE_TESTNET,
      accounts: [process.env.BASE_TEST_PRIVATE_KEY],
      gasPrice: 10000000,
    },
    base_oft: {
      url: process.env.API_KEY_URL_BASE_MAINNET,
      accounts: [process.env.OFT_PRIVATE_KEY],
      gasPrice: 10000000,
    },
    linea_oft_pre: {
      url: process.env.API_KEY_URL_LINEA_MAINNET,
      accounts: [process.env.OFT_PRIVATE_KEY_TEST],
      gasPrice: 80000000,
    },
    linea_oft: {
      url: process.env.API_KEY_URL_LINEA_MAINNET,
      accounts: [process.env.OFT_PRIVATE_KEY],
      gasPrice: 80000000,
    },
  }
};
