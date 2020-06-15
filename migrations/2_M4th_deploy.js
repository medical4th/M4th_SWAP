var M4thToken = artifacts.require("M4thToken");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(M4thToken);
};
