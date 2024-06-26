const hre = require("hardhat");

const nftAddr = "0xECE9128d4265a41F7811e06f4a17D82B12e030fD"
const receiver = ""

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvNft = await hre.ethers.getContractFactory("CarvNft");

    let nft = await CarvNft.attach(nftAddr)
    await nft.mint(receiver, 10, {
        code: "gg",
        price: 123456,
        tier: 5
    })
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
