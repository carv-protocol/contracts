const fs = require("fs");

const Contracts = ["CarvNft", "CarvToken", "veCarvToken", "Settings", "Vault", "ProtocolService", "CarvBridge"]
const ContractsStaking = ["veCarvs"]
const ContractsAirdrop = ["Airdrop01", "Airdrop02", "SBT"]

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
        console.log("success！");
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
        console.log("success！");
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
        console.log("success！");
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