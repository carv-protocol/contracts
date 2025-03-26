const hre = require("hardhat");

const feeBPS = 1000

// test
const vault = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
// prod
// const vault = "0xDF589B84E8ae18f498316c9942cf537C9a405f3E"

// eth sepolia
// const oft = "0xF0376B59Daf4254Ac69949E7DC9082C56c2e3FFF"
// arbi/base sepolia
// const oft = "0x60BBec26e676e8Ccda85Ec1466Ce80CdB7a0b8cc"
// arbi test
// const oft = "0xd6b3e6a2dedc97dde9f3fc50141525a3b7672c47"
// base test
const oft = "0xd4fd6b20cce557aaf933b294b05a3c7cc308a727"
// arbi prod
// const oft = "0xc08Cd26474722cE93F4D0c34D16201461c10AA8C"
// base prod
// const oft = "0xc08Cd26474722cE93F4D0c34D16201461c10AA8C"

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
    // eth sepolia 0x5919F3Fe6D58a5bbc6c27772E2f52BE7245cDB35 0x4F5290B81f00A4751556E6DB9E4f4Df58c73E031
    // arbi sepolia 0x87d3f1Cc5CFABb8081B2c83f148C88070378F1e9
    // base sepolia 0xcc417C6568DD47FBF7706D6Da2d7B6A4336E509D
    // arbi test 0x602b2272dB7A85d7C52e7127C4051fa7c56b5003
    // base test 0x32d9D0F88064205ecD9A5A3cECf222cd46E63f95
    // arbi prod 0x440819C68b1483743266126a6C68c96EB3AB6848
    // base prod 0x440819C68b1483743266126a6C68c96EB3AB6848
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
