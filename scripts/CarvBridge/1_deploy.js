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
    // arbi sepolia 0x623fb310f3d08199Dc6b66b559dD9e5a9AE5d5B3
    // base sepolia 0x32d9D0F88064205ecD9A5A3cECf222cd46E63f95
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
