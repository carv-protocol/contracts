const hre = require("hardhat");
const {addressToBytes32} = require('@layerzerolabs/lz-v2-utilities');

// const sendAmount = 1088888888
const sendAmount = 100

// eth sepolia
// const oftAddr = "0xF0376B59Daf4254Ac69949E7DC9082C56c2e3FFF"
// const contractAddr = "0x5919F3Fe6D58a5bbc6c27772E2f52BE7245cDB35"
// const contractAddr = "0x4F5290B81f00A4751556E6DB9E4f4Df58c73E031"
// const dstEid = 40231

// arbi sepolia
// const oftAddr = "0x60BBec26e676e8Ccda85Ec1466Ce80CdB7a0b8cc"
// const contractAddr = "0x87d3f1Cc5CFABb8081B2c83f148C88070378F1e9"
// const dstEid = 40245

// base sepolia
// const oftAddr = "0x60BBec26e676e8Ccda85Ec1466Ce80CdB7a0b8cc"
// const contractAddr = "0xcc417C6568DD47FBF7706D6Da2d7B6A4336E509D"
// const dstEid = 40231

// arbi test
// const oftAddr = "0xd6b3e6a2dedc97dde9f3fc50141525a3b7672c47"
// const contractAddr = "0x602b2272dB7A85d7C52e7127C4051fa7c56b5003"
// to solana
// const dstEid = 30168
// const dstAddress = "4o8PTZm8CkkZHvJscchCARjmtXwUU6Ytd3htPWPRkMVC"
// to base
// const dstEid = 30184
// const dstAddress = "0x8021f00c28C0e43788AE1a11f1F97eBf80d131bD"

// base test
const oftAddr = "0xd4fd6b20cce557aaf933b294b05a3c7cc308a727"
const contractAddr = "0x32d9D0F88064205ecD9A5A3cECf222cd46E63f95"
// to arbi
const dstEid = 30110
const dstAddress = "0x8021f00c28C0e43788AE1a11f1F97eBf80d131bD"


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

    let fee = await contract.quoteSend(dstEid, addressToBytes32(dstAddress), e18(sendAmount))
    console.log(">>> fee", fee)
    // eth sepolia  105272831012966
    // arbi sepolia 85598084460004
    // base sepolia 109748097732990
    // arbi 19433701316059
    // base 26937486457831

    let tx

    tx = await oft.approve(contractAddr, e18(sendAmount))
    await tx.wait()
    console.log(">>> tx1", tx)

    tx = await contract.send(dstEid, addressToBytes32(dstAddress), e18(sendAmount), { value: fee })
    await tx.wait()
    console.log(">>> tx2", tx)
}

function e10(x) {
    return hre.ethers.BigNumber.from("10000000000").mul(x)
}

function e11(x) {
    return hre.ethers.BigNumber.from("100000000000").mul(x)
}

function e12(x) {
    return hre.ethers.BigNumber.from("1000000000000").mul(x)
}

function e13(x) {
    return hre.ethers.BigNumber.from("10000000000000").mul(x)
}

function e14(x) {
    return hre.ethers.BigNumber.from("100000000000000").mul(x)
}

function e15(x) {
    return hre.ethers.BigNumber.from("1000000000000000").mul(x)
}

function e16(x) {
    return hre.ethers.BigNumber.from("10000000000000000").mul(x)
}

function e17(x) {
    return hre.ethers.BigNumber.from("100000000000000000").mul(x)
}

function e18(x) {
    return hre.ethers.BigNumber.from("1000000000000000000").mul(x)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
