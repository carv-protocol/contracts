const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const Settings = await hre.ethers.getContractFactory("Settings");
    const ProtocolService = await hre.ethers.getContractFactory("ProtocolService");

    let setting = await Settings.deploy();
    await setting.deployed()

    let service = await ProtocolService.deploy();
    await service.deployed()

    let tx = await setting.updateSettings({
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

    console.log(
        "setting: ", setting.address, "\n",
        "service: ", service.address, "\n",
    )
}

function e18(x) {
    return hre.ethers.BigNumber.from("1000000000000000000").mul(x)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
