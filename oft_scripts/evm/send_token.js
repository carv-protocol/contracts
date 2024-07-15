const hre = require("hardhat");

const addrSepolia = "0xEe124EFd323ec2e5148583b39a799ec7Cf6CD897"

const receiver = "0xf407abc7bcf0caf3c48557c8de3710b0dff6ddafc90c2a679e71311755d311eb"

// https://docs.layerzero.network/v2/developers/evm/technical-reference/deployed-contracts
const eidArbSepolia = 40231
const eidSolana = 40168

const overrides = {
    gasLimit: 6000000,
    value: hre.ethers.BigNumber.from("10000000000000000")
}

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    let token = await CarvToken.attach(addrSepolia);

    let tx

    tx = await token.send({
        dstEid: eidSolana,
        to: receiver,
        amountLD: hre.ethers.BigNumber.from("10000000000000000000"),
        minAmountLD: hre.ethers.BigNumber.from("10000000000000000000"),
        extraOptions: "0x",
        composeMsg: "0x",
        oftCmd: "0x",
    }, {
        nativeFee: hre.ethers.BigNumber.from("10000000000000000"),
        lzTokenFee: 0
    }, deployer.address, overrides)
    await tx.wait()

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});