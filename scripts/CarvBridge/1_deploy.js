const hre = require("hardhat");

const feeBPS = 1000
const vault = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

// eth sepolia
// const oft = "0xF0376B59Daf4254Ac69949E7DC9082C56c2e3FFF"
// arbi/base sepolia
const oft = "0x60BBec26e676e8Ccda85Ec1466Ce80CdB7a0b8cc"

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvBridge = await hre.ethers.getContractFactory("CarvBridge");

    let carvBridge = await CarvBridge.deploy(
        feeBPS,
        vault,
        oft,
    )
    await carvBridge.deployed()

    console.log(">>> carvBridge", carvBridge.address)
    // arbi sepolia 0x87d3f1Cc5CFABb8081B2c83f148C88070378F1e9
    // base sepolia 0xcc417C6568DD47FBF7706D6Da2d7B6A4336E509D
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
