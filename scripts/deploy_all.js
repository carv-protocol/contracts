const hre = require("hardhat");

const coordinatorAddress = "0x3c0ca683b403e37668ae3dc4fb62f4b29b6f7a3e";
const carvName = "CT"
const carvSymbol = "CT"
const veCarvName = "VCT"
const veCarvSymbol = "VCT"

const overrides = {
    gasLimit: 60000000,
}

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    const veCarvToken = await hre.ethers.getContractFactory("veCarvToken");
    const Vault = await hre.ethers.getContractFactory("Vault");
    const Settings = await hre.ethers.getContractFactory("Settings");
    const CarvVrf = await hre.ethers.getContractFactory("CarvVrf");
    const ProtocolService = await hre.ethers.getContractFactory("ProtocolService");
    const Proxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");

    // // calculate contract address
    // const vaultAddr = contractAddr(deployer.address, (await deployer.getTransactionCount()) + 2)
    // console.log(vaultAddr)
    //
    // // deploy token
    // let carv = await CarvToken.deploy(carvName, carvSymbol, deployer.address);
    // await carv.deployed()
    // console.log("carv: ", carv.address)
    //
    // let veCarv = await veCarvToken.deploy(veCarvName, veCarvSymbol, carv.address, vaultAddr);
    // await veCarv.deployed()
    // console.log("veCarv: ", veCarv.address)
    //
    // // deploy vault
    // let vault = await Vault.deploy(carv.address, veCarv.address);
    // await vault.deployed()
    // console.log("vault: ", vault.address)
    //
    // // deploy service
    // let setting = await Settings.deploy();
    // await setting.deployed()
    // console.log("setting: ", setting.address)
    //
    // let vrf = await CarvVrf.deploy(coordinatorAddress);
    // await vrf.deployed()
    // console.log("vrf: ", vrf.address)

    let service = await ProtocolService.deploy();
    await service.deployed()
    console.log("service: ", service.address)

    // // deploy proxy
    // let proxy = await Proxy.deploy(service.address, deployer.address, hre.ethers.utils.toUtf8Bytes(""), overrides)
    // await proxy.deployed()
    // console.log("proxy: ", proxy.address)
    //
    // // admin address
    // let adminAddr = await hre.upgrades.erc1967.getAdminAddress(proxy.address)
    // console.log("admin: ", adminAddr)
}

function contractAddr(deployer, nonce) {
    return hre.ethers.utils.getContractAddress({
        from: deployer,
        nonce: nonce,
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
