const hre = require("hardhat");

const tokenAddr = "0xd6B3e6A2DedC97dDE9F3Fc50141525a3B7672C47"
// OFT Config Address. Base64 -> Hex
const tokenAddrSolana = "0xf36bc1b5412b7af8c5337f7bfa14a8fdcd25adf7b84a09272181af00f375e099"
const tokenAddrArbitrum = "0x000000000000000000000000d6B3e6A2DedC97dDE9F3Fc50141525a3B7672C47"

const SolanaEid = 30168
const ArbitrumEid = 30110

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    let token = await CarvToken.attach(tokenAddr);

    let tx

    tx = await token.setPeer(SolanaEid, tokenAddrSolana)
    await tx.wait()

    tx = await token.setEnforcedOptions([{
        eid: SolanaEid,
        msgType: 1,
        options: "0x00030100210100000000000000000000000000030d40000000000000000000000000002625a0",
    }])
    await tx.wait()
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});