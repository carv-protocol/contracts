const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    let token = await CarvToken.deploy(
        "",
        "",
        "0x6EDCE65403992e310A62460808c4b910D972f10f",
        "1000000000000000000000000000000000"
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
