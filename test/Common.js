const { ethers } = require("hardhat");

exports.E = function(x, d) {
    return e(x, d)
}

exports.E18 = function(x) {
    return e18(x)
}

exports.sign = async function(signer, attestationID, result, index) {
    const domain = {
        name: "ProtocolService",
        version: "0.1.0",
        chainId: 42161,
    };
    const types = {
        VerificationData: [
            {name: 'attestationID', type: 'bytes32'},
            {name: 'result', type: 'uint8'},
            {name: 'index', type: 'uint16'}
        ]
    };
    const value = {
        attestationID: attestationID,
        result: result,
        index: index
    };
    const signature = await signer._signTypedData(
        domain,
        types,
        value
    );
    return ethers.utils.splitSignature(signature)
}

exports.deployToken = async function() {
    const [owner, alice, bob] = await ethers.getSigners();

    const CarvToken = await ethers.getContractFactory("CarvToken");
    const veCarvToken = await ethers.getContractFactory("veCarvToken");

    const carv = await CarvToken.deploy(owner.address);
    const veCarv = await veCarvToken.deploy(carv.address, owner.address);

    return { carv, veCarv, owner, alice, bob };
}

exports.deploySettings = async function deploySettings() {
    const [owner] = await ethers.getSigners();
    const Settings = await ethers.getContractFactory("Settings");
    const settings = await Settings.deploy();
    return { settings, owner };
}

exports.deployAll = async function () {
    let carv, veCarv, nft, vault, setting, service, coordinator

    let signers = await ethers.getSigners();

    const CarvToken = await ethers.getContractFactory("CarvToken");
    const veCarvToken = await ethers.getContractFactory("veCarvToken");
    const CarvNft = await ethers.getContractFactory("CarvNft");
    const Vault = await ethers.getContractFactory("Vault");
    const Settings = await ethers.getContractFactory("Settings");
    const ProtocolService = await ethers.getContractFactory("ProtocolService");
    const MockAggregator = await ethers.getContractFactory("Aggregator");
    const MockVRFCoordinator = await ethers.getContractFactory("VRFCoordinator");

    const vaultAddr = contractAddr(signers[0].address, (await signers[0].getTransactionCount()) + 5)
    const serviceAddr = contractAddr(signers[0].address, (await signers[0].getTransactionCount()) + 7)

    const aggregator = await MockAggregator.deploy();
    coordinator = await MockVRFCoordinator.deploy();
    carv = await CarvToken.deploy(signers[0].address);
    veCarv = await veCarvToken.deploy(carv.address, vaultAddr);
    nft = await CarvNft.deploy(carv.address, vaultAddr, serviceAddr);
    vault = await Vault.deploy(carv.address, veCarv.address);
    setting = await Settings.deploy();
    service = await ProtocolService.deploy(carv.address, nft.address, vault.address, coordinator.address);

    await vault.initialize(signers[0].address, nft.address, service.address)
    await setting.updateSettings({
        maxVrfActiveNodes: 2000,
        nodeMinOnlineDuration: 21600, // 6 hours
        nodeVerifyDuration: 1800,  // 30 minutes
        nodeSlashReward: e18(10) ,  // 10 veCARV
        minTeeStakeAmount: e18(1e5),  // 10,000 CARV
        teeSlashAmount: e18(100),      // 100 veCARV
        teeUnstakeDuration: 21600,   // 6 hours
        nodeMaxMissVerifyCount: 5,
        commissionRate: 100,       // 1%
        maxNodeWeights: 100,
    })

    await vault.updateAggregatorAddress(aggregator.address);
    await service.updateVrfConfig({
        keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        subId: 100,
        requestConfirmations: 3,
        callbackGasLimit: 10000,
        nativePayment: true
    })
    await service.updateSettingsAddress(setting.address)

    return [carv, veCarv, nft, vault, setting, service, coordinator, signers]
}

function contractAddr(deployer, nonce) {
    return ethers.utils.getContractAddress({
        from: deployer,
        nonce: nonce,
    });
}

function e(x, d) {
    return ethers.BigNumber.from("10").pow(d).mul(x)
}

function e18(x) {
    return ethers.BigNumber.from("1000000000000000000").mul(x)
}