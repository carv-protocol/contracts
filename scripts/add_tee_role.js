const hre = require("hardhat");

const proxyAddr = "0x773cF326c07b63EdEE1AF7a7d3D4075b1F7f8861"
const carvAddr = "0x0F1E8b62292c914d3Cd220Ca4419C131C69E140a"
const overrides = {
    gasLimit: 6000000,
}

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    const ProtocolService = await hre.ethers.getContractFactory("ProtocolService");

    // let carv = await CarvToken.attach(carvAddr)
    // await carv.approve(proxyAddr, e18(1000000))

    let proxy = await ProtocolService.attach(proxyAddr)
    // await proxy.modifyTeeRole(deployer.address, true)
    await proxy.teeStake(e18(100000))

}

function e18(x) {
    return hre.ethers.BigNumber.from("1000000000000000000").mul(x)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
