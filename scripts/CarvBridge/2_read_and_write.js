const hre = require("hardhat");

// eth sepolia
const contractAddr = "0xDce980Cb0D1C49DDcD6A7811B9299AFB34895010"

const dstEid = 40231

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

    tx = await contract.updateSupportedDstEid(dstEid)
    await tx.wait()
    console.log(">>> tx", tx)

    support = await contract.supportedDstEid(dstEid)
    console.log(">>> support dstEid", support)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
