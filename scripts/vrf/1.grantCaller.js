const hre = require("hardhat");

const vrf_address = "0xA87B9466DaDCfEB9CffAcD71C9282DFC84fB11b6";
async function main() {

    const [deployer] = await hre.ethers.getSigners();
    console.log("xxl deployer : ",deployer.address);

    const CarvVrfFactory = await hre.ethers.getContractFactory("CarvVrf");
    const vrf = await CarvVrfFactory.attach(vrf_address);

    const tx = await vrf.grantCaller(deployer.address)
    let txRep = await tx.wait()

    console.log("xxl receipt :",txRep);
  
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
