const hre = require("hardhat");

const chainID = 42161;
const coordinatorAddress = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";
const aggregatorAddress = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";
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
    const vaultAddr = contractAddr(deployer.address, (await deployer.getTransactionCount()) + 2)

    // deploy
    let carv = await CarvToken.deploy(deployer.address);
    await carv.deployed()
    let veCarv = await veCarvToken.deploy(carv.address, vaultAddr);
    await veCarv.deployed()
    let vault = await Vault.deploy(carv.address, veCarv.address);
    await vault.deployed()
    let setting = await Settings.deploy();
    await setting.deployed()
    let vrf = await CarvVrf.deploy(coordinatorAddress);
    await vrf.deployed()
    let service = await ProtocolService.deploy();
    await service.deployed()
    let proxy = await Proxy.deploy(service.address, deployer.address, hre.ethers.utils.toUtf8Bytes(""), overrides)
    await proxy.deployed()
    let nft = await CarvNft.deploy(carv.address, vault.address, proxy.address);
    await nft.deployed()

    // initialize vault
    let tx = await vault.initialize(deployer.address, nft.address, proxy.address, overrides)
    await tx.wait()
    tx = await vault.updateAggregatorAddress(aggregatorAddress, overrides)
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
        maxNodeWeights: 100,
    })
    await tx.wait()
    tx = await vrf.updateVrfConfig({
        keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        subId: 100,
        requestConfirmations: 3,
        callbackGasLimit: 10000,
        numWords: 1,
        nativePayment: true
    })
    await tx.wait()
    tx = await vrf.grantCaller(proxy.address)
    await tx.wait()
    tx = await proxy.updateSettingsAddress(setting.address)
    await tx.wait()
    await proxy.updateVrfAddress(vrf.address)

    // print contract address
    let adminAddr = await hre.upgrades.erc1967.getAdminAddress("0xa85debb2292161e8767272f9C0d44522A84FCB58")
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
