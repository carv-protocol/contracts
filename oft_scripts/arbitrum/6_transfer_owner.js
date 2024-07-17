const hre = require("hardhat");

const tokenAdddr = ""
const multisig = ""

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    let token = await CarvToken.attach(tokenAdddr);

    let tx
    tx = await token.transferOwnership(multisig)
    await tx.wait()

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
