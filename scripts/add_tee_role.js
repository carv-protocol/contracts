const hre = require("hardhat");

const proxyAddr = "0x39fc2E18dDdfad008374A527b028fAB8d43845F9"
const carvAddr = "0x202fAFb638Edb7C2C4fFCf496FF3e579D72738bA"
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
    // await proxy.teeStake(e18(100000))
    await proxy.teeReportAttestations(["test"], overrides)
}

function e18(x) {
    return hre.ethers.BigNumber.from("1000000000000000000").mul(x)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
