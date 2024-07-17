const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const GenerateOptions = await hre.ethers.getContractFactory("GenerateOptions");
    let options = await GenerateOptions.deploy();

    let tx
    tx = await options.getOptions(200000, 2500000)

    console.log(tx)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});