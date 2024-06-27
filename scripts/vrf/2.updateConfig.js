const hre = require("hardhat");

const vrf_address = "0xA87B9466DaDCfEB9CffAcD71C9282DFC84fB11b6";
const vrfConfig = {
    keyHash: "0x8472ba59cf7134dfe321f4d61a430c4857e8b19cdd5230b09952a92671c24409",
    subId: "15064785153228559465248773078908350745285477278877473237747083654201889057496",
    requestConfirmations: 1,
    callbackGasLimit: 100000,
    numWords: 1
}

async function main() {


    const [deployer] = await hre.ethers.getSigners();
    console.log("xxl deployer : ",deployer.address);

    const CarvVrfFactory = await hre.ethers.getContractFactory("CarvVrf");
    const vrf = await CarvVrfFactory.attach(vrf_address);

    tx = await vrf.updateVrfConfig(vrfConfig)
    let txRep = await tx.wait()

    console.log("xxl receipt :",txRep);

  
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
