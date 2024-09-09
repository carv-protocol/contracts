const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { E, E18, deployAll, signNodeEnter, signNodeExit, signModifyCommission, signSetRewardClaimer} = require("./Common")

describe("Service", function () {
    let carv, veCarv, nft, vault, setting, vrf, proxy, service, coordinator, signers
    const CarvTotalRewards = E18(249998940)

    beforeEach(async function () {
        [carv, veCarv, nft, vault, setting, vrf, proxy, service, coordinator, signers] = await deployAll()
    })

    it("Tee", async function () {
        let alice = signers[1]

        await expect(proxy.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEE_ROLE")), alice.address)).not.to.be.reverted;
        await expect(proxy.connect(alice).teeReportAttestations(["test"])).not.to.be.reverted;
        await coordinator.callback(1, [123456789])
    });

    it("Node", async function () {
        let alice = signers[1]

        await nft.mint(alice.address, 1, {code:"", price: 0, tier: 0});

        await expect(proxy.connect(alice).nodeEnter(alice.address)).to.be.rejected;

        await expect(proxy.connect(alice).delegate(1, alice.address)).not.to.be.reverted;

        await expect(proxy.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;

        await expect(proxy.connect(alice).nodeExit()).not.to.be.reverted

    });

    it("Node-EIP712", async function () {
        let alice = signers[1]
        await nft.mint(alice.address, 1, {code:"", price: 0, tier: 0});
        await expect(proxy.connect(alice).delegate(1, alice.address)).not.to.be.reverted;

        let currentTimestamp = await time.latest()

        let signature = await signNodeEnter(alice, 31337, alice.address, currentTimestamp)
        await expect(proxy.nodeEnterWithSignature(
            alice.address, currentTimestamp, alice.address, signature.v, signature.r, signature.s
        )).to.be.reverted

        currentTimestamp += 600
        signature = await signNodeEnter(alice, 31337, alice.address, currentTimestamp)
        await expect(proxy.nodeEnterWithSignature(
            alice.address, currentTimestamp, alice.address, signature.v, signature.r, signature.s
        )).not.to.be.reverted

        signature = await signNodeExit(alice, 31337, currentTimestamp)
        await expect(proxy.nodeExitWithSignature(
            currentTimestamp, alice.address, signature.v, signature.r, signature.s
        )).not.to.be.reverted

        signature = await signModifyCommission(alice, 31337, 100, currentTimestamp)
        await expect(proxy.nodeModifyCommissionRateWithSignature(
            100, currentTimestamp, alice.address, signature.v, signature.r, signature.s
        )).not.to.be.reverted

        signature = await signSetRewardClaimer(alice, 31337, alice.address, currentTimestamp)
        await expect(proxy.nodeSetRewardClaimerWithSignature(
            alice.address, currentTimestamp, alice.address, signature.v, signature.r, signature.s
        )).not.to.be.reverted

    });

    it("Report", async function () {
        let owner = signers[0]
        let alice = signers[1]

        await nft.mint(alice.address, 1, {code:"", price: 0, tier: 0});
        await expect(proxy.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
        await expect(proxy.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;

        await expect(proxy.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEE_ROLE")), owner.address)).not.to.be.reverted;
        await expect(proxy.teeReportAttestations(["test"])).not.to.be.reverted;
        await coordinator.callback(1, [123456789])

        await proxy.connect(alice).nodeReportVerification(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")),
            0,
            0
        )

        // console.log(await proxy.attestations(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"))))
        // console.log(await proxy.nodeInfos(alice.address))
    });

    it("Claim", async function () {
        let owner = signers[0]
        let alice = signers[1]

        await carv.approve(vault.address, E18(250000000))
        await vault.rewardsDeposit(CarvTotalRewards)

        await nft.mint(alice.address, 1, {code:"", price: 0, tier: 0});
        await expect(proxy.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
        await expect(proxy.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;

        await expect(proxy.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEE_ROLE")), owner.address)).not.to.be.reverted;
        await expect(proxy.teeReportAttestations(["test"])).not.to.be.reverted;
        await coordinator.callback(1, [123456789])

        await proxy.connect(alice).nodeReportVerification(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")),
            0,
            0
        )

        await expect(proxy.connect(alice).nodeClaim(alice.address)).to.be.reverted
        const hours8 = 8 * 60 * 60;
        await time.increase(hours8);
        await proxy.connect(alice).nodeReportDailyActive(alice.address)

        const hours24 = 24 * 60 * 60;
        await time.increase(hours24);
        await proxy.connect(alice).nodeReportDailyActive(alice.address)
        await time.increase(hours24);
        await proxy.connect(alice).nodeReportDailyActive(alice.address)
        // await expect(service.connect(alice).nodeClaim()).not.to.be.reverted

        // await service.connect(alice).claimRewards(1)
    })

    it("Delegation", async function () {
        let owner = signers[0]
        let alice = signers[1]
        let bob = signers[2]

        await nft.mint(alice.address, 1, {code:"", price: 0, tier: 0});
        await nft.mint(bob.address, 1, {code:"", price: 0, tier: 0});
        await nft.mint(owner.address, 1, {code:"", price: 0, tier: 0});

        await expect(proxy.connect(alice).delegate(1, bob.address)).not.to.be.reverted;
        await expect(proxy.connect(bob).delegate(2, bob.address)).not.to.be.reverted;

        expect(await proxy.delegation(1)).to.equal(bob.address);
        expect(await proxy.delegation(2)).to.equal(bob.address);
        expect(await proxy.delegationWeights(bob.address)).to.equal(2);

        await expect(proxy.connect(bob).redelegate(2, bob.address)).to.be.reverted;
        await expect(proxy.connect(bob).redelegate(2, owner.address)).not.to.be.reverted;

        expect(await proxy.delegation(2)).to.equal(owner.address);
        expect(await proxy.delegationWeights(bob.address)).to.equal(1);
        expect(await proxy.delegationWeights(owner.address)).to.equal(1);

        await expect(proxy.connect(alice).undelegate(1)).not.to.be.reverted;
        expect(await proxy.delegationWeights(bob.address)).to.equal(0);
    })

    it("Node Replace", async function () {
        let alice = signers[1]
        let bob = signers[2]
        let cindy = signers[3]
        let david = signers[4]
        let tokenIndex = await nft.tokenIndex()

        await setting.updateSettings({
            maxVrfActiveNodes: 3,
            nodeMinOnlineDuration: 21600, // 6 hours
            nodeVerifyDuration: 1800,  // 30 minutes
            nodeSlashReward: E18(10) ,  // 10 veCARV
            minCommissionRateModifyInterval: 604800, // 1 week
            nodeMaxMissVerifyCount: 5,
            maxCommissionRate: 10000,  // 100%
            maxCommissionRateModifyLimitOnce: 500, // 5%
            maxNodeWeights: 100,
        })

        await nft.mint(alice.address, 2, {code:"", price: 0, tier: 0});
        await proxy.connect(alice).delegate(tokenIndex+1, alice.address)
        await proxy.connect(alice).delegate(tokenIndex+2, alice.address)
        await expect(proxy.connect(alice).nodeEnter(alice.address)).not.to.be.rejected;

        await nft.mint(bob.address, 3, {code:"", price: 0, tier: 0});
        await proxy.connect(bob).delegate(tokenIndex+3, bob.address)
        await proxy.connect(bob).delegate(tokenIndex+4, bob.address)
        await proxy.connect(bob).delegate(tokenIndex+5, bob.address)
        await expect(proxy.connect(bob).nodeEnter(bob.address)).not.to.be.rejected;

        await nft.mint(cindy.address, 1, {code:"", price: 0, tier: 0});
        await proxy.connect(cindy).delegate(tokenIndex+6, cindy.address)
        await expect(proxy.connect(cindy).nodeEnter(cindy.address)).not.to.be.rejected;

        await nft.mint(david.address, 2, {code:"", price: 0, tier: 0});
        await proxy.connect(david).delegate(tokenIndex+7, david.address)
        await proxy.connect(david).delegate(tokenIndex+8, david.address)
        await expect(proxy.connect(david).nodeEnter(bob.address)).to.be.rejected;
        await expect(proxy.connect(david).nodeEnter(alice.address)).to.be.rejected;
        await expect(proxy.connect(david).nodeEnter(cindy.address)).not.to.be.rejected;

        await setting.updateSettings({
            maxVrfActiveNodes: 2000,
            nodeMinOnlineDuration: 21600, // 6 hours
            nodeVerifyDuration: 1800,  // 30 minutes
            nodeSlashReward: E18(10) ,  // 10 veCARV
            minCommissionRateModifyInterval: 604800, // 1 week
            nodeMaxMissVerifyCount: 5,
            maxCommissionRate: 10000,  // 100%
            maxCommissionRateModifyLimitOnce: 500, // 5%
            maxNodeWeights: 100,
        })
    });

    it("Node Slash", async function () {
        await carv.approve(vault.address, E18(250000000))
        await vault.rewardsDeposit(CarvTotalRewards)


        let owner = signers[0]
        let alice = signers[1]

        await proxy.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SLASH_ROLE")), owner.address)

        await nft.mint(alice.address, 1, {code:"", price: 0, tier: 0});
        await expect(proxy.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
        await expect(proxy.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;

        await expect(proxy.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEE_ROLE")), owner.address)).not.to.be.reverted;

        // ------
        await expect(proxy.teeReportAttestations(["test"])).not.to.be.reverted;
        await coordinator.callback(1, [123456789])
        await proxy.connect(alice).nodeReportVerification(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")),
            0,
            1
        )
        await expect(proxy.nodeSlash(
            alice.address,
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")),
            0
        )).to.be.reverted;
        const hour = 3600
        await time.increase(hour);

        await expect(proxy.nodeSlash(
            alice.address,
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")),
            0
        )).to.be.reverted;

        // ------
        await expect(proxy.teeReportAttestations(["test1"])).not.to.be.reverted;
        await coordinator.callback(2, [123456789])

        await time.increase(hour);

        await expect(proxy.nodeSlash(
            alice.address,
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test1")),
            0
        )).not.to.be.reverted;

        // console.log(await proxy.nodeInfos(alice.address))

        // ------
        await expect(proxy.teeReportAttestations(["test2"])).not.to.be.reverted;
        await coordinator.callback(3, [123456789])
        await time.increase(hour);
        await expect(proxy.nodeSlash(
            alice.address,
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test2")),
            0
        )).not.to.be.reverted;
        // ------
        await expect(proxy.teeReportAttestations(["test3"])).not.to.be.reverted;
        await coordinator.callback(4, [123456789])
        await time.increase(hour);
        await expect(proxy.nodeSlash(
            alice.address,
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test3")),
            0
        )).not.to.be.reverted;
        // ------
        await expect(proxy.teeReportAttestations(["test4"])).not.to.be.reverted;
        await coordinator.callback(5, [123456789])
        await time.increase(hour);
        await expect(proxy.nodeSlash(
            alice.address,
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test4")),
            0
        )).not.to.be.reverted;
        // ------
        await expect(proxy.teeReportAttestations(["test5"])).not.to.be.reverted;
        await coordinator.callback(6, [123456789])
        await time.increase(hour);
        await expect(proxy.nodeSlash(
            alice.address,
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test5")),
            0
        )).not.to.be.reverted;

        // console.log(await proxy.nodeInfos(alice.address))

    });
});