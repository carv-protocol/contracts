const fs = require("fs");

const Contracts = ["CarvNft", "CarvToken", "veCarvToken", "Settings", "Vault", "ProtocolService"]

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