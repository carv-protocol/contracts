const hre = require("hardhat");

const chainID = 42161;
const nftAddr = "0x6584533decbcb8c05fb7EAbFa93f92b7b3A85038"
const carvAddr = "0x9185D228478e1c88E06eFEBb66e5911e64b3192B"
const veCarvAddr = "0x8852154aa877b0a00A11fAfCCCAd72E230eF2D55"
const vaultAddr = "0xD75C3958Ce45076C3e07AD46fa1Bb447b02ef041"
const serviceAddr = "0xf14D1BA8e14BB8C6Bfa4608488f0Ca80e6548Efb"
const proxyAddr = "0xd35AF24099f6BAd4690eD6E858273580e2b1954A"
const settingAddr = "0xB861B55920772D17a4aED4923017FA4A67Feac6E"
const vrfAddr = "0xee722312d90579E09aCC117D0e090D38c3a9FdF1"

const serviceConfig = {
    maxVrfActiveNodes: 2000,
    nodeMinOnlineDuration: 21600, // 6 hours
    nodeVerifyDuration: 1800,  // 30 minutes
    nodeSlashReward: e18(10) ,  // 10 veCARV
    minTeeStakeAmount: e18(1e5),  // 10,000 CARV
    teeSlashAmount: e18(100),      // 100 veCARV
    teeUnstakeDuration: 21600,   // 6 hours
    minCommissionRateModifyInterval: 300, // 604800, // 1 week
    nodeMaxMissVerifyCount: 5,
    maxCommissionRate: 10000,  // 100%
    maxNodeWeights: 100,
}
const vrfConfig = {
    keyHash: "0x8472ba59cf7134dfe321f4d61a430c4857e8b19cdd5230b09952a92671c24409",
    subId: "15064785153228559465248773078908350745285477278877473237747083654201889057496",
    requestConfirmations: 1,
    callbackGasLimit: 2000000,
    numWords: 1,
    enableNativePayment: false,
}
const overrides = {
    gasLimit: 60000000,
}

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    const veCarvToken = await hre.ethers.getContractFactory("veCarvToken");
    const CarvNft = await hre.ethers.getContractFactory("CarvNft");
    const Vault = await hre.ethers.getContractFactory("Vault");
    const Settings = await hre.ethers.getContractFactory("Settings");
    const CarvVrf = await hre.ethers.getContractFactory("CarvVrf");
    const ProtocolService = await hre.ethers.getContractFactory("ProtocolService");
    const Proxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");

    let tx

    // initialize vault
    let vault = Vault.attach(vaultAddr)
    let carv = CarvToken.attach(carvAddr)

    // tx = await vault.initialize(deployer.address, proxyAddr, overrides)
    // await tx.wait()

    // tx = await carv.approve(vaultAddr, e18(250000000))
    // await tx.wait()

    // tx = await vault.rewardsInit()
    // await tx.wait()

    // initialize service
    let proxy = ProtocolService.attach(proxyAddr)

    // tx = await proxy.initialize(carvAddr, nftAddr, vaultAddr, chainID, overrides)
    // await tx.wait()

    let setting = Settings.attach(settingAddr)

    // tx = await setting.updateSettings(serviceConfig)
    // await tx.wait()

    let vrf = CarvVrf.attach(vrfAddr)

    // tx = await vrf.updateVrfConfig(vrfConfig)
    // await tx.wait()
    //
    // tx = await vrf.grantCaller(proxyAddr)
    // await tx.wait()
    //
    // tx = await proxy.updateSettingsAddress(settingAddr)
    // await tx.wait()
    //
    // tx = await proxy.updateVrfAddress(vrfAddr)
    // await tx.wait()

}

function e18(x) {
    return hre.ethers.BigNumber.from("1000000000000000000").mul(x)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
