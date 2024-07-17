const hre = require("hardhat");

const proxyAddr = "0xFFbB58c8370f99b2ae619328D6B99D77Fef190Cb";
const newImplAddr = "0xd0c8F84032b03034957E14e77Affa07cCb41fddf"

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
