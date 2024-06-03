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
    let carv, veCarv, nft, vault, setting, vrf, proxy, proxyAdmin, service, coordinator

    let signers = await ethers.getSigners();

    const CarvToken = await ethers.getContractFactory("CarvToken");
    const veCarvToken = await ethers.getContractFactory("veCarvToken");
    const CarvNft = await ethers.getContractFactory("CarvNft");
    const Vault = await ethers.getContractFactory("Vault");
    const Settings = await ethers.getContractFactory("Settings");
    const CarvVrf = await ethers.getContractFactory("CarvVrf");
    const ProtocolService = await ethers.getContractFactory("ProtocolService");
    const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
    const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
    const MockAggregator = await ethers.getContractFactory("Aggregator");
    const MockVRFCoordinator = await ethers.getContractFactory("VRFCoordinator");

    const vaultAddr = contractAddr(signers[0].address, (await signers[0].getTransactionCount()) + 5)
    const proxyAddr = contractAddr(signers[0].address, (await signers[0].getTransactionCount()) + 10)

    const aggregator = await MockAggregator.deploy();
    coordinator = await MockVRFCoordinator.deploy();
    carv = await CarvToken.deploy(signers[0].address);
    veCarv = await veCarvToken.deploy(carv.address, vaultAddr);
    nft = await CarvNft.deploy(carv.address, vaultAddr, proxyAddr);
    vault = await Vault.deploy(carv.address, veCarv.address);
    setting = await Settings.deploy();
    vrf = await CarvVrf.deploy(coordinator.address);
    service = await ProtocolService.deploy();
    proxyAdmin = await ProxyAdmin.deploy(signers[0].address);
    proxy = await Proxy.deploy(service.address, proxyAdmin.address, ethers.utils.toUtf8Bytes(""))
    proxy = ProtocolService.attach(proxy.address)
    await proxy.initialize(carv.address, nft.address, vault.address)

    await vault.initialize(signers[0].address, nft.address, proxy.address)
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
    await vrf.updateVrfConfig({
        keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        subId: 100,
        requestConfirmations: 3,
        callbackGasLimit: 10000,
        numWords: 1,
        nativePayment: true
    })
    await vrf.grantCaller(proxy.address)

    await proxy.updateSettingsAddress(setting.address)
    await proxy.updateVrfAddress(vrf.address)

    return [carv, veCarv, nft, vault, setting, vrf, proxy, proxyAdmin, service, coordinator, signers]
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