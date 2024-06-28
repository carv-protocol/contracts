const hre = require("hardhat");

const proxyAddr = "0xd35AF24099f6BAd4690eD6E858273580e2b1954A";
const newImplAddr = "0xf14D1BA8e14BB8C6Bfa4608488f0Ca80e6548Efb"

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
    const Proxy = await hre.ethers.getContractFactory("ProtocolService");
    let adminAddr = await hre.upgrades.erc1967.getAdminAddress(proxyAddr)
    let proxyAdmin = await ProxyAdmin.attach(adminAddr)
    let proxy = await Proxy.attach(proxyAddr)
    let tx = await proxyAdmin.upgradeAndCall(proxyAddr, newImplAddr, hre.ethers.utils.toUtf8Bytes(""))
    await tx.wait()

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
