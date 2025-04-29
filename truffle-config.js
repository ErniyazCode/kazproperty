const path = require("path");

module.exports = {
  contracts_directory: path.join(__dirname, "src/contracts"), 
  contracts_build_directory: path.join(__dirname, "src/abis"),
  migrations_directory: path.join(__dirname, "src/migration"),


  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "6777", // Match any network id
    },
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
