const hre = require("hardhat");

const chainID = 421614;
const coordinatorAddress = "0x50d47e4142598e3411aa864e08a44284e471ac6f";
const nftName = ""
const nftSymbol = ""
const vrfConfig = {
    keyHash: "0x027f94ff1465b3525f9fc03e9ff7d6d2c0953482246dd6ae07570c45d6631414",
    subId: 339,
    requestConfirmations: 1,
    callbackGasLimit: 1000000,
    numWords: 1
}
const overrides = {
    gasLimit: 6000000,
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

    // calculate contract address
    const vaultAddr = contractAddr(deployer.address, (await deployer.getTransactionCount()) + 3)

    // deploy token
    let nft = await CarvNft.deploy(nftName, nftSymbol);
    await nft.deployed()
    let carv = await CarvToken.deploy(deployer.address);
    await carv.deployed()
    let veCarv = await veCarvToken.deploy(carv.address, vaultAddr);
    await veCarv.deployed()

    // deploy vault
    let vault = await Vault.deploy(carv.address, veCarv.address);
    await vault.deployed()

    // deploy service
    let setting = await Settings.deploy();
    await setting.deployed()
    let vrf = await CarvVrf.deploy(coordinatorAddress);
    await vrf.deployed()
    let service = await ProtocolService.deploy();
    await service.deployed()

    // deploy proxy
    let proxy = await Proxy.deploy(service.address, deployer.address, hre.ethers.utils.toUtf8Bytes(""), overrides)
    await proxy.deployed()

    // initialize vault
    let tx = await vault.initialize(deployer.address, proxy.address, overrides)
    await tx.wait()
    tx = await carv.approve(vault.address, e18(250000000))
    await tx.wait()
    tx = await vault.rewardsInit()
    await tx.wait()

    // initialize service
    proxy = ProtocolService.attach(proxy.address)
    tx = await proxy.initialize(carv.address, nft.address, vault.address, chainID, overrides)
    await tx.wait()
    tx = await setting.updateSettings({
        maxVrfActiveNodes: 2000,
        nodeMinOnlineDuration: 21600, // 6 hours
        nodeVerifyDuration: 1800,  // 30 minutes
        nodeSlashReward: e18(10) ,  // 10 veCARV
        minTeeStakeAmount: e18(1e5),  // 10,000 CARV
        teeSlashAmount: e18(100),      // 100 veCARV
        teeUnstakeDuration: 21600,   // 6 hours
        minCommissionRateModifyInterval: 604800, // 1 week
        nodeMaxMissVerifyCount: 5,
        maxCommissionRate: 10000,  // 100%
        maxNodeWeights: 100,
    })
    await tx.wait()
    tx = await vrf.updateVrfConfig(vrfConfig)
    await tx.wait()
    tx = await vrf.grantCaller(proxy.address)
    await tx.wait()
    tx = await proxy.updateSettingsAddress(setting.address)
    await tx.wait()
    await proxy.updateVrfAddress(vrf.address)

    // print contract address
    let adminAddr = await hre.upgrades.erc1967.getAdminAddress(proxy.address)
    console.log(
        "carv: ", carv.address, "\n",
        "veCarv: ", veCarv.address, "\n",
        "vault: ", vault.address, "\n",
        "setting: ", setting.address, "\n",
        "vrf: ", vrf.address, "\n",
        "service: ", service.address, "\n",
        "proxy: ", proxy.address, "\n",
        "nft: ", nft.address, "\n",
        "admin: ", adminAddr
    )
}

function contractAddr(deployer, nonce) {
    return hre.ethers.utils.getContractAddress({
        from: deployer,
        nonce: nonce,
    });
}

function e18(x) {
    return hre.ethers.BigNumber.from("1000000000000000000").mul(x)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
