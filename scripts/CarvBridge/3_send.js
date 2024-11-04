const hre = require("hardhat");

const sendAmount = 3
const dstEid = 40231

// eth sepolia
const oftAddr = "0xF0376B59Daf4254Ac69949E7DC9082C56c2e3FFF"
const contractAddr = "0xDce980Cb0D1C49DDcD6A7811B9299AFB34895010"

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
    // 105272831012966

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
