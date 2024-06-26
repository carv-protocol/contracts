const hre = require("hardhat");

const chainID = 421614;
const proxyAddr = "0x39fc2E18dDdfad008374A527b028fAB8d43845F9";
const newImplAddr = ""
const vrfAddr = ""

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    // const ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    // let adminAddr = await hre.upgrades.erc1967.getAdminAddress(proxyAddr)
    // let proxyAdmin = await ProxyAdmin.attach(adminAddr)
    // await proxyAdmin.upgradeAndCall(proxyAddr, newImplAddr, hre.ethers.utils.toUtf8Bytes(""))

    // const CarvVrf = await hre.ethers.getContractFactory("CarvVrf");
    // let vrf = await CarvVrf.attach(vrfAddr)
    // await vrf.updateVrfConfig({
    //     keyHash: "0x027f94ff1465b3525f9fc03e9ff7d6d2c0953482246dd6ae07570c45d6631414",
    //     subId: 339,
    //     requestConfirmations: 1,
    //     callbackGasLimit: 1000000,
    //     numWords: 1,
    // })
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
