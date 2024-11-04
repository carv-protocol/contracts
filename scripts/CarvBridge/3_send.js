const hre = require("hardhat");

const sendAmount = 10

// eth sepolia
// const oftAddr = "0xF0376B59Daf4254Ac69949E7DC9082C56c2e3FFF"
// const contractAddr = "0xDce980Cb0D1C49DDcD6A7811B9299AFB34895010"
// const dstEid = 40231

// arbi sepolia
// const oftAddr = "0x60BBec26e676e8Ccda85Ec1466Ce80CdB7a0b8cc"
// const contractAddr = "0x623fb310f3d08199Dc6b66b559dD9e5a9AE5d5B3"
// const dstEid = 40245

// base sepolia
const oftAddr = "0x60BBec26e676e8Ccda85Ec1466Ce80CdB7a0b8cc"
const contractAddr = "0x32d9D0F88064205ecD9A5A3cECf222cd46E63f95"
const dstEid = 40231

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvBridge = await hre.ethers.getContractFactory("CarvBridge");
    let contract = await CarvBridge.attach(contractAddr);

    let support = await contract.supportedDstEid(dstEid)
    console.log(">>> support dstEid", support)

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    let oft = await CarvToken.attach(oftAddr);

    let name = await oft.name()
    console.log(">>> oft name ", name)

    let fee = await contract.quoteSend(dstEid, e18(sendAmount))
    console.log(">>> fee", fee)
    // eth sepolia  105272831012966
    // arbi sepolia 85598084460004
    // base sepolia 109748097732990

    let tx

    tx = await oft.approve(contractAddr, e18(sendAmount))
    await tx.wait()
    console.log(">>> tx", tx)

    tx = await contract.send(dstEid, e18(sendAmount), {value: fee})
    await tx.wait()
    console.log(">>> tx", tx)
}

function e18(x) {
    return hre.ethers.BigNumber.from("1000000000000000000").mul(x)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
