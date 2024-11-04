const hre = require("hardhat");

// eth sepolia
// const contractAddr = "0xDce980Cb0D1C49DDcD6A7811B9299AFB34895010"
// arbi sepolia
// const contractAddr = "0x623fb310f3d08199Dc6b66b559dD9e5a9AE5d5B3"
// base sepolia
const contractAddr = "0x32d9D0F88064205ecD9A5A3cECf222cd46E63f95"

// eth sepolia
// const dstEid = 40161
// arbi sepolia
const dstEid = 40231
// base sepolia
// const dstEid = 40245


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
