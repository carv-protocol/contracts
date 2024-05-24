const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Service", function () {
    function E(x, d) {
        return ethers.BigNumber.from("10").pow(d).mul(x)
    }

    function E18(x) {
        return ethers.BigNumber.from("1000000000000000000").mul(x)
    }

    function contractAddr(deployer, nonce) {
        return ethers.utils.getContractAddress({
            from: deployer,
            nonce: nonce,
        });
    }

    let carv, veCarv, nft, vault, setting, service, owner, alice, bob, coordinator

    beforeEach(async function () {
        [owner, alice, bob] = await ethers.getSigners();

        const CarvToken = await ethers.getContractFactory("CarvToken");
        const veCarvToken = await ethers.getContractFactory("veCarvToken");
        const CarvNft = await ethers.getContractFactory("CarvNft");
        const Vault = await ethers.getContractFactory("Vault");
        const Settings = await ethers.getContractFactory("Settings");
        const ProtocolService = await ethers.getContractFactory("ProtocolService");
        const MockAggregator = await ethers.getContractFactory("Aggregator");
        const MockVRFCoordinator = await ethers.getContractFactory("VRFCoordinator");

        const nftAddr = contractAddr(owner.address, (await owner.getTransactionCount()) + 4)
        const vaultAddr = contractAddr(owner.address, (await owner.getTransactionCount()) + 5)
        const settingAddr = contractAddr(owner.address, (await owner.getTransactionCount()) + 6)
        const serviceAddr = contractAddr(owner.address, (await owner.getTransactionCount()) + 7)

        const aggregator = await MockAggregator.deploy();
        coordinator = await MockVRFCoordinator.deploy();

        carv = await CarvToken.deploy(owner.address);
        veCarv = await veCarvToken.deploy(carv.address, vaultAddr);
        nft = await CarvNft.deploy(carv.address, vaultAddr, serviceAddr);
        vault = await Vault.deploy(carv.address, veCarv.address);
        setting = await Settings.deploy();
        service = await ProtocolService.deploy(carv.address, nftAddr, vaultAddr, coordinator.address);

        await vault.initialize(owner.address, nftAddr, serviceAddr)
        await setting.updateSettings({
            maxVrfActiveNodes: 2000,
            nodeMinOnlineDuration: 21600, // 6 hours
            nodeVerifyDuration: 1800,  // 30 minutes
            nodeSlashReward: E18(10) ,  // 10 veCARV
            minTeeStakeAmount: E18(1e5),  // 10,000 CARV
            teeSlashAmount: E18(100),      // 100 veCARV
            teeUnstakeDuration: 21600,   // 6 hours
            nodeMaxMissVerifyCount: 5,
            commissionRate: 100,       // 1%
            maxNodeWeights: 100,
        })
        await service.initialize()

        await vault.updateAggregatorAddress(aggregator.address);
        await service.updateVrfConfig({
            keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
            subId: 100,
            requestConfirmations: 3,
            callbackGasLimit: 10000,
            nativePayment: true
        })
        await service.updateSettings(settingAddr)
    })

    it("Tee", async function () {
        await carv.transfer(alice.address, E18(10000000))

        await expect(service.connect(alice).teeStake(E18(1000000))).to.be.reverted;
        await expect(service.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEE_ROLE")), alice.address)).not.to.be.reverted;

        await carv.connect(alice).approve(service.address, E18(1000000))
        await expect(service.connect(alice).teeStake(E18(1000000))).not.to.be.reverted;
        await expect(service.connect(alice).teeUnstake()).not.to.be.reverted;

        await expect(service.connect(alice).teeReportAttestation("test")).to.be.reverted;
        await carv.connect(alice).approve(service.address, E18(1000000))
        await expect(service.connect(alice).teeStake(E18(1000000))).not.to.be.reverted;
        await expect(service.connect(alice).teeReportAttestation("test")).not.to.be.reverted;
        await expect(service.connect(alice).teeUnstake()).to.be.reverted;
        await coordinator.callback(1, [123456789])

        const hours6 = 6 * 60 * 60;
        await time.increase(hours6);
        await expect(service.connect(alice).teeUnstake()).not.to.be.reverted;
    });

    it("Node", async function () {

        await nft.connect(alice).mint();

        await expect(service.connect(alice).nodeEnter(alice.address)).to.be.rejected;

        await expect(service.connect(alice).delegate(1, alice.address)).not.to.be.reverted;

        await expect(service.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;

        await expect(service.connect(alice).nodeExit()).not.to.be.reverted

    });

    it("Report", async function () {

        await nft.connect(alice).mint();
        await expect(service.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
        await expect(service.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;

        await expect(service.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEE_ROLE")), owner.address)).not.to.be.reverted;
        await carv.approve(service.address, E18(1000000))
        await expect(service.teeStake(E18(1000000))).not.to.be.reverted;
        await expect(service.teeReportAttestation("test")).not.to.be.reverted;
        await coordinator.callback(1, [123456789])

        await service.connect(alice).nodeReportVerification(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")),
            0,
            0
        )

        // console.log(await service.attestations(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"))))
        // console.log(await service.nodeInfos(alice.address))
    });

    it("Slash", async function () {

        await nft.connect(alice).mint();
        await expect(service.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
        await expect(service.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;

        await expect(service.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEE_ROLE")), owner.address)).not.to.be.reverted;
        await carv.approve(service.address, E18(1000000))
        await expect(service.teeStake(E18(1000000))).not.to.be.reverted;
        await expect(service.teeReportAttestation("test")).not.to.be.reverted;
        await coordinator.callback(1, [123456789])

        await service.connect(alice).nodeReportVerification(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")),
            0,
            2
        )

        await expect(service.connect(alice).teeSlash(
            owner.address,
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")))).to.be.reverted;

        const minutes30 = 30 * 60;
        await time.increase(minutes30);

        await expect(service.connect(alice).teeSlash(
            owner.address,
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")))).not.to.be.reverted;

        // console.log(await service.attestations(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"))))
        // console.log(await service.nodeInfos(alice.address))
        // console.log(await service.teeStakeInfos(owner.address))
    });

    it("Claim", async function () {

        await carv.approve(vault.address, E18(250000000))
        await vault.rewardsInit()

        await nft.connect(alice).mint();
        await expect(service.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
        await expect(service.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;

        await expect(service.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEE_ROLE")), owner.address)).not.to.be.reverted;
        await carv.approve(service.address, E18(1000000))
        await expect(service.teeStake(E18(1000000))).not.to.be.reverted;
        await expect(service.teeReportAttestation("test")).not.to.be.reverted;
        await coordinator.callback(1, [123456789])

        await service.connect(alice).nodeReportVerification(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")),
            0,
            0
        )

        await expect(service.connect(alice).nodeClaim()).to.be.reverted
        const hours8 = 8 * 60 * 60;
        await time.increase(hours8);
        await service.connect(alice).nodeReportDailyActive()

        const hours24 = 24 * 60 * 60;
        await time.increase(hours24);
        console.log(await service.todayOffset())
        await service.connect(alice).nodeReportDailyActive()
        await time.increase(hours24);
        console.log(await service.todayOffset())
        await service.connect(alice).nodeReportDailyActive()
        await expect(service.connect(alice).nodeClaim()).not.to.be.reverted

        await service.connect(alice).claimRewards(1)
    })

    it("Delegation", async function () {
        await nft.connect(alice).mint();
        await nft.connect(bob).mint();
        await nft.connect(owner).mint();

        await expect(service.connect(alice).delegate(1, bob.address)).not.to.be.reverted;
        await expect(service.connect(bob).delegate(2, bob.address)).not.to.be.reverted;

        expect(await service.delegation(1)).to.equal(bob.address);
        expect(await service.delegation(2)).to.equal(bob.address);
        expect(await service.delegationWeights(bob.address)).to.equal(2);

        await expect(service.connect(bob).redelegate(2, bob.address)).to.be.reverted;
        await expect(service.connect(bob).redelegate(2, owner.address)).not.to.be.reverted;

        expect(await service.delegation(2)).to.equal(owner.address);
        expect(await service.delegationWeights(bob.address)).to.equal(1);
        expect(await service.delegationWeights(owner.address)).to.equal(1);

        await expect(service.connect(alice).undelegate(1)).not.to.be.reverted;
        expect(await service.delegationWeights(bob.address)).to.equal(0);
    })
});