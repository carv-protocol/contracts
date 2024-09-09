const hre = require("hardhat");

const tokenAddr = "0xc08Cd26474722cE93F4D0c34D16201461c10AA8C"
// OFT Config Address. Base64 -> Hex
const tokenAddrSolana = "0x95d3706d9bc887a447589f3ec4cf9ee2419fd8f11377bad400515d374ba42a6f"
const tokenAddrEthereum = "0x000000000000000000000000c08Cd26474722cE93F4D0c34D16201461c10AA8C"
const tokenAddrBase = "0x000000000000000000000000c08Cd26474722cE93F4D0c34D16201461c10AA8C"
const tokenAddrLinea = "0x000000000000000000000000c08Cd26474722cE93F4D0c34D16201461c10AA8C"

const SolanaEid = 30168
const EthereumEid = 30101
const BaseEid = 30184
const LineaEid = 30183

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    let token = await CarvToken.attach(tokenAddr);

    let tx

    tx = await token.setPeer(LineaEid, tokenAddrLinea)
    await tx.wait()

    tx = await token.setEnforcedOptions([{
        eid: LineaEid,
        msgType: 1,
        options: "0x00030100210100000000000000000000000000030d40000000000000000000000000002625a0",
    }])
    await tx.wait()
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});