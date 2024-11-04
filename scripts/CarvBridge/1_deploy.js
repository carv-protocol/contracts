const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    const CarvBridge = await hre.ethers.getContractFactory("CarvBridge");

    let carvBridge = await CarvBridge.deploy(
        1000,
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0xF0376B59Daf4254Ac69949E7DC9082C56c2e3FFF",
    )
    await carvBridge.deployed()

    console.log(">>> carvBridge", carvBridge.address)
    // eth sepolia
    // 0x515E0C4e0065A4Ce480D4766B694b6De325eC66b
    // 0x6064A2FB23D3AF76CDf6CA20CEB535E40799d3a5
    // 0x4471973FA26D28bf16e0DCDA0C7FAfb1b7BF28F3
    // 0x902392ea8d9677Ad2f3405867A5c21ABe33C8874
    // 0xc7889FEcdd98c1d674dF18Ce5e3d0Fb72670eD39
    // 0x6f698BAECd12bD6cC8c81486B6Ad313D76d6184F
    // 0xDce980Cb0D1C49DDcD6A7811B9299AFB34895010
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
