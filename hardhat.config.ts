import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import dotenv from "dotenv";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-contract-sizer";
import "hardhat/types/config";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    currency: "USD",
    coinmarketcap: process.env.coinMarketCap_API,
  },

  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      gas: 15000000,
      gasPrice: 10000000000,
      timeout: 600000,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      gas: 15000000,
      gasPrice: 10000000000,
      timeout: 600000,
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      gas: 15000000,
      gasPrice: 5000000000,
      timeout: 600000,
    },
    polygon: {
      url: "https://rpc-mainnet.maticvigil.com/",
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      gas: 15000000,
      gasPrice: 5000000000,
      timeout: 600000,
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      gas: 15000000,
      gasPrice: 5000000000,
      timeout: 600000,
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
