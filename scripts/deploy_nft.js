const hre = require("hardhat");

const NAME = "";
const SYMBOL = "";

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvNft = await hre.ethers.getContractFactory("CarvNft");
    let nft = await CarvNft.deploy(NAME, SYMBOL);
    await nft.deployed()

    console.log(
        "nft: ", nft.address, "\n",
    )
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
