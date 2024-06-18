const hre = require("hardhat");

const proxyAddr = "0xCB37148ADD8b8be58034A742495D935c78D9Fd76"
const carvAddr = "0x202fAFb638Edb7C2C4fFCf496FF3e579D72738bA"
const overrides = {
    gasLimit: 6000000,
}

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    const ProtocolService = await hre.ethers.getContractFactory("ProtocolService");

    // let carv = await CarvToken.attach(carvAddr)
    // await carv.approve(proxyAddr, e18(1000000))

    // let proxy = await ProtocolService.attach(proxyAddr)
    // await proxy.modifyTeeRole("0x7f57004E08ef1702b2b88b87ae01a561ae10F10e", true)
    // await proxy.teeStake(e18(100000))
    // await proxy.teeReportAttestations(["test"], overrides)

    // await proxy.updateVrfAddress("0x392cf5925742B8a020661552cc1E2f210d6B49B0")

    // const CarvVrf = await hre.ethers.getContractFactory("CarvVrf");
    // let vrf = await CarvVrf.attach("0x392cf5925742B8a020661552cc1E2f210d6B49B0")
    // await vrf.grantCaller(proxyAddr)
    //
    // await vrf.updateVrfConfig({
    //     keyHash: "0x027f94ff1465b3525f9fc03e9ff7d6d2c0953482246dd6ae07570c45d6631414",
    //     subId: 339,
    //     requestConfirmations: 1,
    //     callbackGasLimit: 1000000,
    //     numWords: 1,
    // })
    // await vrf.requestRandomWords(overrides)
}

function e18(x) {
    return hre.ethers.BigNumber.from("1000000000000000000").mul(x)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
