const hre = require("hardhat");

const NAME = "CARV Verifier License";
const SYMBOL = "CARV-VERIFIER";
const TransferProhibitedUntil = 1750496400
const RedeemProhibitedUntil = 1734771600

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvNft = await hre.ethers.getContractFactory("CarvNft");
    let nft = await CarvNft.deploy(NAME, SYMBOL);
    await nft.deployed()

    let tx = await nft.setTransferProhibitedUntil(TransferProhibitedUntil)
    await tx.wait()

    tx = await nft.setRedeemProhibitedUntil(RedeemProhibitedUntil)
    await tx.wait()

    console.log(
        "nft: ", nft.address, "\n",
    )
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
