const hre = require("hardhat");

const chainID = 42161;
const nftAddr = "0x6584533decbcb8c05fb7EAbFa93f92b7b3A85038"
const carvAddr = "0x903CF971c3Cbd482DD351f9E8DB420314C4a5886"
const veCarvAddr = "0xA0DdA481F6893CE04c41f13eAe5b13980C2F31fE"
const vaultAddr = "0xA88c25267753B05BA2C24fC8565a47f7aA380Cda"
const serviceAddr = "0xFE7Fdfc9D50eeEeC78d75015F9BD6157Eb937779"
const proxyAddr = "0xFFbB58c8370f99b2ae619328D6B99D77Fef190Cb"
const settingAddr = "0x1aa70E340B0e76CeDA1247e1ef28E603BD4b5585"
const vrfAddr = "0x26fcc204ec9A9289C9703a317B29B0A67a6Fa099"

const serviceConfig = {
    maxVrfActiveNodes: 5000,
    nodeMinOnlineDuration: 21600, // 6 hours
    nodeVerifyDuration: 1800,  // 30 minutes
    nodeSlashReward: e18(10) ,  // 10 veCARV
    minCommissionRateModifyInterval: 604800, // 604800, // 1 week
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
