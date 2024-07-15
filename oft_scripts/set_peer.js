const hre = require("hardhat");

const addrSepolia = "0xEe124EFd323ec2e5148583b39a799ec7Cf6CD897"

const tokenAddrArbSepolia = "0x000000000000000000000000Ee124EFd323ec2e5148583b39a799ec7Cf6CD897"
// OFT Config Address. Base64 -> Hex
const tokenAddrSolana = "0xda7189104b5cf990fa5eddc23ec4b4007eeeb33796a5edf66207fedea74bcdfa"
const eidArbSepolia = 40231
const eidSolana = 40168

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvToken = await hre.ethers.getContractFactory("CarvToken");
    let token = await CarvToken.attach(addrSepolia);

    let tx

    tx = await token.setPeer(eidArbSepolia, tokenAddrArbSepolia)
    await tx.wait()
    tx = await token.setPeer(eidSolana, tokenAddrSolana)
    await tx.wait()

    // console.log(await token.isPeer(eidArbSepolia, tokenAddrArbSepolia))
    // console.log(await token.isPeer(eidSolana, tokenAddrSolana))

    tx = await token.setEnforcedOptions([{
        eid: eidArbSepolia,
        msgType: 1,
        options: "0x0003010011010000000000000000000000000000ea60"
    },{
        eid: eidSolana,
        msgType: 1,
        options: "0x00030100110100000000000000000000000000030d40"
    }])
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});