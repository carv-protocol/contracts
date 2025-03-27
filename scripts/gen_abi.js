const fs = require("fs");

const Contracts = ["CarvNft", "CarvToken", "veCarvToken", "Settings", "Vault", "ProtocolService", "CarvBridge"]
const ContractsStaking = ["veCarvs"]
const ContractsAirdrop = ["Airdrop01", "Airdrop02", "SBT"]
const ContractsNodeSale = ["NodeSale", "NodeBuyback"]
const ContractsAggregator = ["CarvAggregator"]
const ContractsOld = ["Peel", "BatchTransfer"]
const ContractsGovernance = ["CarvGovernor", "CarvVotes"]

function genAbi() {
    fs.access("./artifacts/contracts", (err) => {
        if (err) {
            console.log("run this after compile");
            return
        }

        if (!fsExistsSync("./abi")) {
            fs.mkdirSync("./abi");
        }

        for (let index in Contracts) {
            fs.writeFile(
                "./abi/" + Contracts[index] + ".json",
                JSON.stringify(require('../artifacts/contracts/' + Contracts[index] + '.sol/' + Contracts[index] + '.json').abi),
                function (err) {
                    if (err) {
                        return console.error(err);
                    }
                }
            );
        }
        console.log("contracts success！");
    });

    fs.access("./artifacts/contracts/staking", (err) => {
        if (err) {
            console.log("run this after compile");
            return
        }

        if (!fsExistsSync("./abi")) {
            fs.mkdirSync("./abi");
        }

        for (let index in ContractsStaking) {
            fs.writeFile(
                "./abi/" + ContractsStaking[index] + ".json",
                JSON.stringify(require('../artifacts/contracts/staking/' + ContractsStaking[index] + '.sol/' + ContractsStaking[index] + '.json').abi),
                function (err) {
                    if (err) {
                        return console.error(err);
                    }
                }
            );
        }
        console.log("staking success！");
    });

    fs.access("./artifacts/contracts/airdrop", (err) => {
        if (err) {
            console.log("run this after compile");
            return
        }

        if (!fsExistsSync("./abi")) {
            fs.mkdirSync("./abi");
        }

        for (let index in ContractsAirdrop) {
            fs.writeFile(
                "./abi/" + ContractsAirdrop[index] + ".json",
                JSON.stringify(require('../artifacts/contracts/airdrop/' + ContractsAirdrop[index] + '.sol/' + ContractsAirdrop[index] + '.json').abi),
                function (err) {
                    if (err) {
                        return console.error(err);
                    }
                }
            );
        }
        console.log("airdrop success！");
    });

    fs.access("./artifacts/contracts/node_sale", (err) => {
        if (err) {
            console.log("run this after compile");
            return
        }

        if (!fsExistsSync("./abi")) {
            fs.mkdirSync("./abi");
        }

        for (let index in ContractsNodeSale) {
            fs.writeFile(
                "./abi/" + ContractsNodeSale[index] + ".json",
                JSON.stringify(require('../artifacts/contracts/node_sale/' + ContractsNodeSale[index] + '.sol/' + ContractsNodeSale[index] + '.json').abi),
                function (err) {
                    if (err) {
                        return console.error(err);
                    }
                }
            );
        }
        console.log("node_sale success！");
    });

    fs.access("./artifacts/contracts/aggregators", (err) => {
        if (err) {
            console.log("run this after compile");
            return
        }

        if (!fsExistsSync("./abi")) {
            fs.mkdirSync("./abi");
        }

        for (let index in ContractsAggregator) {
            fs.writeFile(
                "./abi/" + ContractsAggregator[index] + ".json",
                JSON.stringify(require('../artifacts/contracts/aggregators/' + ContractsAggregator[index] + '.sol/' + ContractsAggregator[index] + '.json').abi),
                function (err) {
                    if (err) {
                        return console.error(err);
                    }
                }
            );
        }
        console.log("aggregators success！");
    });

    fs.access("./artifacts/contracts/old", (err) => {
        if (err) {
            console.log("run this after compile");
            return
        }

        if (!fsExistsSync("./abi")) {
            fs.mkdirSync("./abi");
        }

        for (let index in ContractsOld) {
            fs.writeFile(
                "./abi/" + ContractsOld[index] + ".json",
                JSON.stringify(require('../artifacts/contracts/old/' + ContractsOld[index] + '.sol/' + ContractsOld[index] + '.json').abi),
                function (err) {
                    if (err) {
                        return console.error(err);
                    }
                }
            );
        }
        console.log("old success！");
    });

    fs.access("./artifacts/contracts/governance", (err) => {
        if (err) {
            console.log("run this after compile");
            return
        }

        if (!fsExistsSync("./abi")) {
            fs.mkdirSync("./abi");
        }

        for (let index in ContractsGovernance) {
            fs.writeFile(
                "./abi/" + ContractsGovernance[index] + ".json",
                JSON.stringify(require('../artifacts/contracts/governance/' + ContractsGovernance[index] + '.sol/' + ContractsGovernance[index] + '.json').abi),
                function (err) {
                    if (err) {
                        return console.error(err);
                    }
                }
            );
        }
        console.log("governance success！");
    });
}

function fsExistsSync(path) {
    try{
        fs.accessSync(path,fs.F_OK);
    }catch(e){
        return false;
    }
    return true;
}

genAbi()