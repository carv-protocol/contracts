const hre = require("hardhat");

const tokenAddr = "0xd6B3e6A2DedC97dDE9F3Fc50141525a3B7672C47"

const receiver = "0x000000000000000000000000Cfce99eE8630fe51974c9a94f1d9153e9F656E81"
// const receiver = "0x50184b7e1fb344eb289a5259dcb98bf16c9f11d4a72faa0bee88511eb1798f72"

const SolanaEid = 30168
const EthereumEid = 30101

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    let token = await CarvToken.attach(tokenAddr);

    let tx

    tx = await token.quoteSend({
        dstEid: EthereumEid,
        to: receiver,
        amountLD: e18(10),
        minAmountLD: e18(10),
        extraOptions: "0x",
        composeMsg: "0x",
        oftCmd: "0x",
    }, false)

    tx = await token.send({
        dstEid: EthereumEid,
        to: receiver,
        amountLD: e18(10),
        minAmountLD: e18(10),
        extraOptions: "0x",
        composeMsg: "0x",
        oftCmd: "0x",
    }, {
        nativeFee: tx.nativeFee,
        lzTokenFee: 0
    }, deployer.address, {value: tx.nativeFee})
    await tx.wait()
}

function e18(x) {
    return hre.ethers.BigNumber.from("1000000000000000000").mul(x)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});