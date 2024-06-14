const hre = require("hardhat");
const { signModifyCommission } = require("../test/Common")


const proxyAddr = "0x773cF326c07b63EdEE1AF7a7d3D4075b1F7f8861"
const overrides = {
    gasLimit: 6000000,
}

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const ProtocolService = await hre.ethers.getContractFactory("ProtocolService");

    let proxy = await ProtocolService.attach(proxyAddr)
    let currentTimestamp = 100000
    let signature = await signModifyCommission(deployer, 42161, 100, currentTimestamp)

    await proxy.nodeModifyCommissionRateWithSignature(
        100, currentTimestamp, deployer.address, signature.v, signature.r, signature.s
    )

}

function e18(x) {
    return hre.ethers.BigNumber.from("1000000000000000000").mul(x)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
