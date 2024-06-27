const hre = require("hardhat");

const coordinatorAddress = "0x3c0ca683b403e37668ae3dc4fb62f4b29b6f7a3e";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("xxl deployer : ",deployer.address);

    const CarvVrf = await hre.ethers.getContractFactory("CarvVrf");
    let vrf = await CarvVrf.deploy(coordinatorAddress);
    await vrf.deployed()

    let vrfAddreess = vrf.address
    console.log("xxl vrf addreess : ",vrfAddreess);

}



main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
