const hre = require("hardhat");

const nftAddr = "0x6584533decbcb8c05fb7EAbFa93f92b7b3A85038"
const addrs = []

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvNft = await hre.ethers.getContractFactory("CarvNft");
    let nft = await CarvNft.attach(nftAddr);

    // let tx = await nft.setTransferOnceWhitelist(addrs)
    // await tx.wait()

    // let tx = await nft.setBaseURI("https://public.carv.io/verifier_license/")
    // await tx.wait()
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
