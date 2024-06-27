const hre = require("hardhat");

const chainID = 421614;
const proxyAddr = "0x39fc2E18dDdfad008374A527b028fAB8d43845F9";
const newImplAddr = "0xe01574264B2A330B248AeA2023F86F8BF7750a51"
const settingAddr = "0x9691cA9635cfa5E32B5F90D155CD9eB6fEf2bFF4"

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    const Proxy = await hre.ethers.getContractFactory("ProtocolService");
    let adminAddr = await hre.upgrades.erc1967.getAdminAddress(proxyAddr)
    let proxyAdmin = await ProxyAdmin.attach(adminAddr)
    let proxy = await Proxy.attach(proxyAddr)
    let tx = await proxyAdmin.upgradeAndCall(proxyAddr, newImplAddr, hre.ethers.utils.toUtf8Bytes(""))
    await tx.wait()
    await proxy.updateSettingsAddress(settingAddr)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
