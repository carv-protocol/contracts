const hre = require("hardhat");

const sendAmount = 20

// eth sepolia
// const oftAddr = "0xF0376B59Daf4254Ac69949E7DC9082C56c2e3FFF"
// const contractAddr = "0xDce980Cb0D1C49DDcD6A7811B9299AFB34895010"
// const dstEid = 40231

// arbi sepolia
// const oftAddr = "0x60BBec26e676e8Ccda85Ec1466Ce80CdB7a0b8cc"
// const contractAddr = "0x87d3f1Cc5CFABb8081B2c83f148C88070378F1e9"
// const dstEid = 40245

// base sepolia
const oftAddr = "0x60BBec26e676e8Ccda85Ec1466Ce80CdB7a0b8cc"
const contractAddr = "0xcc417C6568DD47FBF7706D6Da2d7B6A4336E509D"
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
