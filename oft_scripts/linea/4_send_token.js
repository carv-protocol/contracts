const hre = require("hardhat");

const tokenAddr = "0xc08Cd26474722cE93F4D0c34D16201461c10AA8C"

const receiver = "0x000000000000000000000000B61D971Bc04Eff621eB4D69f8D2b9672FE644277"

const ArbitrumEid = 30110

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    let token = await CarvToken.attach(tokenAddr);

    let tx

    tx = await token.quoteSend({
        dstEid: ArbitrumEid,
        to: receiver,
        amountLD: e18(10),
        minAmountLD: e18(10),
        extraOptions: "0x",
        composeMsg: "0x",
        oftCmd: "0x",
    }, false)

    tx = await token.send({
        dstEid: ArbitrumEid,
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