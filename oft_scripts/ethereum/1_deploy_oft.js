const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    let token = await CarvToken.deploy(
        "T",
        "T",
        "0x1a44076050125825900e736c501f859c50fE728c",
        0
    );
    await token.deployed()

    console.log(
        "token: ", token.address, "\n",
        "deployer: ", deployer.address
    )
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
