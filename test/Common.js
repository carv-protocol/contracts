const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

exports.E = function(x, d) {
    return e(x, d)
}

exports.E18 = function(x) {
    return e18(x)
}

exports.signModifyCommission = async function(signer, chainID, commissionRate, expiredAt) {
    const types = {
        NodeModifyCommissionRateData: [
            {name: 'commissionRate', type: 'uint32'},
            {name: 'expiredAt', type: 'uint256'}
        ]
    };
    const value = {
        commissionRate: commissionRate,
        expiredAt: expiredAt
    };

    return sign(signer, chainID, types, value)
}

exports.signNodeEnter = async function(signer, chainID, replacedNode, expiredAt) {
    const types = {
        NodeEnterData: [
            {name: 'replacedNode', type: 'address'},
            {name: 'expiredAt', type: 'uint256'}
        ]
    };
    const value = {
        replacedNode: replacedNode,
        expiredAt: expiredAt
    };

    return sign(signer, chainID, types, value)
}

exports.signNodeExit = async function(signer, chainID, expiredAt) {
    const types = {
        NodeExitData: [
            {name: 'expiredAt', type: 'uint256'}
        ]
    };
    const value = {
        expiredAt: expiredAt
    };

    return sign(signer, chainID, types, value)
}

exports.signSetRewardClaimer = async function(signer, chainID, claimer, expiredAt) {
    const types = {
        NodeSetRewardClaimerData: [
            {name: 'claimer', type: 'address'},
            {name: 'expiredAt', type: 'uint256'}
        ]
    };
    const value = {
        claimer: claimer,
        expiredAt: expiredAt
    };

    return sign(signer, chainID, types, value)
}

exports.signVerification = async function(signer, chainID, attestationID, result, index) {
    const types = {
        VerificationData: [
            {name: 'attestationID', type: 'bytes32'},
            {name: 'result', type: 'uint8'},
            {name: 'index', type: 'uint32'}
        ]
    };
    const value = {
        attestationID: attestationID,
        result: result,
        index: index
    };
    return sign(signer, chainID, types, value)
}

exports.deployGovernor = async function() {
    const [owner, alice, bob] = await ethers.getSigners();

    const CarvVotes = await ethers.getContractFactory("CarvVotes");
    const TimelockController = await ethers.getContractFactory("TimelockController");
    const CarvGovernor = await ethers.getContractFactory("CarvGovernor");

    const votes = await CarvVotes.deploy("Votes", "Votes", owner.address, owner.address);
    const timelock = await TimelockController.deploy(60, [owner.address], [owner.address], owner.address);
    const governor = await CarvGovernor.deploy("gov", votes.address, timelock.address, 60, 60, 100, 8, owner.address, owner.address);

    return [votes, timelock, governor, owner, alice, bob ];
}

exports.deployToken = async function() {
    const [owner, alice, bob] = await ethers.getSigners();

    const CarvToken = await ethers.getContractFactory("MockCarvToken");
    const veCarvToken = await ethers.getContractFactory("veCarvToken");

    const carv = await CarvToken.deploy("CARV", "CARV", owner.address);
    const veCarv = await veCarvToken.deploy("veCARV", "veCARV", carv.address);

    return [ carv, veCarv, owner, alice, bob ];
}

exports.deployToken2 = async function() {
    const [owner, alice, bob] = await ethers.getSigners();

    const CarvToken = await ethers.getContractFactory("MockCarvToken");
    const veCarvTokens = await ethers.getContractFactory("veCarvs");
    const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");

    const carv = await CarvToken.deploy("CARV", "CARV", owner.address);
    const veCarvs = await veCarvTokens.deploy();

    let proxy = await Proxy.deploy(veCarvs.address, owner.address, ethers.utils.toUtf8Bytes(""))
    proxy = veCarvTokens.attach(proxy.address)
    await proxy.initialize("veCARV(s)", "veCARV(s)", carv.address)

    await proxy.updateSettings({
        rewardPerSecond: e(1, 16),
        minStakingAmount: e18(10),
    });

    return [carv, proxy, owner, alice, bob];
}

exports.deployToken3 = async function() {
    const [owner, alice, bob] = await ethers.getSigners();

    const CarvToken = await ethers.getContractFactory("MockCarvToken");
    const veCarvTokensi = await ethers.getContractFactory("veCarvsi");
    const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");

    const carv = await CarvToken.deploy("CARV", "CARV", owner.address);
    const veCarvsi = await veCarvTokensi.deploy();

    let proxy = await Proxy.deploy(veCarvsi.address, owner.address, ethers.utils.toUtf8Bytes(""))
    proxy = veCarvTokensi.attach(proxy.address)
    await proxy.initialize("veCARV(si)", "veCARV(si)", carv.address)

    return [carv, proxy, owner, alice, bob];
}

exports.deploySettings = async function deploySettings() {
    const [owner] = await ethers.getSigners();
    const Settings = await ethers.getContractFactory("contracts/Settings.sol:Settings");
    const settings = await Settings.deploy();
    return { settings, owner };
}

exports.deployNft = async function () {
    const [owner, alice, bob, cindy] = await ethers.getSigners();
    const CarvNft = await ethers.getContractFactory("CarvNft");
    let nft = await CarvNft.deploy("CarvNft", "CarvNft");
    return [owner, alice, bob, cindy, nft]
}

exports.deploySBT = async function () {
    const [owner, alice, bob, cindy] = await ethers.getSigners();
    const SBT = await ethers.getContractFactory("SBT");
    let sbt = await SBT.deploy("SBT", "SBT");
    return [owner, alice, bob, cindy, sbt]
}

exports.deployNodeSale = async function () {
    const [owner, receiver, alice, bob] = await ethers.getSigners();

    const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
    const CarvToken = await ethers.getContractFactory("MockCarvToken");
    const Aggregator = await ethers.getContractFactory("Aggregator");
    const NodeSale = await ethers.getContractFactory("NodeSale");
    const CarvNft = await ethers.getContractFactory("CarvNft");

    const nft = await CarvNft.deploy("CarvNft", "CarvNft");
    const carv = await CarvToken.deploy("CARV", "CARV", owner.address);
    const carvAggregator = await Aggregator.deploy();
    const ethAggregator = await Aggregator.deploy();

    let nodeSale = await NodeSale.deploy();
    nodeSale = await Proxy.deploy(nodeSale.address, owner.address, ethers.utils.toUtf8Bytes(""))
    nodeSale = NodeSale.attach(nodeSale.address)
    await nodeSale.initialize(carv.address, nft.address)

    await nodeSale.setReceiver(receiver.address)
    await nodeSale.setOracle(0, carvAggregator.address)
    await nodeSale.setOracle(1, ethAggregator.address)

    return [owner, receiver, alice, bob, carv, nodeSale, carvAggregator, ethAggregator, nft]
}

exports.deployVault = async function () {
    const [owner, service, alice] = await ethers.getSigners();

    const CarvToken = await ethers.getContractFactory("MockCarvToken");
    const veCarvToken = await ethers.getContractFactory("veCarvToken");
    const Vault = await ethers.getContractFactory("Vault");

    const carv = await CarvToken.deploy("CARV", "CARV", owner.address);
    const veCarv = await veCarvToken.deploy("veCARV", "veCARV", carv.address);
    const vault = await Vault.deploy();

    await veCarv.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DEPOSITOR_ROLE")), vault.address);
    await veCarv.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TRANSFER_ROLE")), vault.address);

    await vault.initialize(carv.address, veCarv.address, service.address, 1719792000)
    return [owner, service, alice, vault, carv, veCarv]
}

exports.deployAll = async function () {
    let carv, veCarv, nft, vault, setting, vrf, proxy, service, coordinator

    let signers = await ethers.getSigners();

    const CarvToken = await ethers.getContractFactory("MockCarvToken");
    const veCarvToken = await ethers.getContractFactory("veCarvToken");
    const CarvNft = await ethers.getContractFactory("CarvNft");
    const Vault = await ethers.getContractFactory("Vault");
    const Settings = await ethers.getContractFactory("contracts/Settings.sol:Settings");
    const CarvVrf = await ethers.getContractFactory("CarvVrf");
    const ProtocolService = await ethers.getContractFactory("ProtocolService");
    const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
    const MockVRFCoordinator = await ethers.getContractFactory("VRFCoordinator");

    const startTimestamp = await time.latest() //1719792000

    coordinator = await MockVRFCoordinator.deploy();
    carv = await CarvToken.deploy("CARV", "CARV", signers[0].address);
    veCarv = await veCarvToken.deploy("veCARV", "veCARV", carv.address);
    vault = await Vault.deploy();
    setting = await Settings.deploy();
    vrf = await CarvVrf.deploy(coordinator.address);
    service = await ProtocolService.deploy();
    proxy = await Proxy.deploy(service.address, signers[0].address, ethers.utils.toUtf8Bytes(""))
    nft = await CarvNft.deploy("CarvNft", "CarvNft");
    proxy = ProtocolService.attach(proxy.address)
    await proxy.initialize(carv.address, nft.address, vault.address)

    await veCarv.setTreasuryAddress(vault.address)
    await veCarv.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DEPOSITOR_ROLE")), vault.address);
    await veCarv.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TRANSFER_ROLE")), vault.address);

    await vault.initialize(carv.address, veCarv.address, proxy.address, startTimestamp)
    await setting.updateSettings({
        maxVrfActiveNodes: 100000,
        nodeMinOnlineDuration: 21600, // 6 hours
        nodeVerifyDuration: 1800,  // 30 minutes
        nodeSlashReward: e18(10) ,  // 10 veCARV
        minCommissionRateModifyInterval: 604800, // 1 week
        nodeMaxMissVerifyCount: 2,
        maxCommissionRate: 10000,  // 100%
        maxCommissionRateModifyLimitOnce: 500, // 5%
        maxNodeWeights: 100,
    })

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

    return [carv, veCarv, nft, vault, setting, vrf, proxy, service, coordinator, signers]
}

async function sign(signer, chainID, types, value) {
    const domain = {
        name: "ProtocolService",
        version: "1.0.0",
        chainId: chainID,
    };
    const signature = await signer._signTypedData(
        domain,
        types,
        value
    );
    return ethers.utils.splitSignature(signature)
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


exports.runNode = async function (signer,nft,proxy) {

    await nft.mint(signer.address, 1, {code:"", price: 0, tier: 0});
    await proxy.connect(signer).delegate(await nft.tokenIndex(), signer.address)
    await proxy.connect(signer).nodeEnter(signer.address)
}