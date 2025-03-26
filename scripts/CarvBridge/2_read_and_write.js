const hre = require("hardhat");

// eth sepolia
// const contractAddr = "0x5919F3Fe6D58a5bbc6c27772E2f52BE7245cDB35"
// const contractAddr = "0x4F5290B81f00A4751556E6DB9E4f4Df58c73E031"
// arbi sepolia
// const contractAddr = "0x87d3f1Cc5CFABb8081B2c83f148C88070378F1e9"
// base sepolia
// const contractAddr = "0xcc417C6568DD47FBF7706D6Da2d7B6A4336E509D"
// arbi test
// const contractAddr = "0x60BBec26e676e8Ccda85Ec1466Ce80CdB7a0b8cc"
// const contractAddr = "0x602b2272dB7A85d7C52e7127C4051fa7c56b5003"
// base test
// const contractAddr = "0x60BBec26e676e8Ccda85Ec1466Ce80CdB7a0b8cc"
const contractAddr = "0x32d9D0F88064205ecD9A5A3cECf222cd46E63f95"
// arbi prod
// const contractAddr = "0x440819C68b1483743266126a6C68c96EB3AB6848"
// base prod
// const contractAddr = "0x440819C68b1483743266126a6C68c96EB3AB6848"


// eth sepolia
// const dstEid = 40161
// arbi sepolia
// const dstEid = 40231
// base sepolia
// const dstEid = 40245
// arbi
const dstEid = 30110
// base
// const dstEid = 30184
// solana
// const dstEid = 30168

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvBridge = await hre.ethers.getContractFactory("CarvBridge");
    let contract = await CarvBridge.attach(contractAddr);

    let feeBPS = await contract.feeBPS()
    console.log(">>> feeBPS", feeBPS)

    let vault = await contract.vault()
    console.log(">>> vault", vault)

    let oft = await contract.oft()
    console.log(">>> oft", oft)

    let support = await contract.supportedDstEid(dstEid)
    console.log(">>> support", support)

    let tx

    tx = await contract.updateSupportedDstEid(dstEid, true)
    await tx.wait()
    console.log(">>> tx", tx)

    support = await contract.supportedDstEid(dstEid)
    console.log(">>> support dstEid", support)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
