const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { E, E18, deployAll} = require("./Common")

describe("Service", function () {
    let carv, veCarv, nft, vault, setting, vrf, proxy, proxyAdmin, service, coordinator, signers

    beforeEach(async function () {
        [carv, veCarv, nft, vault, setting, vrf, proxy, proxyAdmin, service, coordinator, signers] = await deployAll()
    })

    it("Tee", async function () {
        let alice = signers[1]

        await carv.transfer(alice.address, E18(10000000))

        await expect(proxy.connect(alice).teeStake(E18(1000000))).to.be.reverted;
        await expect(proxy.modifyTeeRole(alice.address, true)).not.to.be.reverted;

        await carv.connect(alice).approve(proxy.address, E18(1000000))
        await expect(proxy.connect(alice).teeStake(E18(1000000))).not.to.be.reverted;
        await expect(proxy.connect(alice).teeUnstake()).not.to.be.reverted;

        await expect(proxy.connect(alice).teeReportAttestations(["test"])).to.be.reverted;
        await carv.connect(alice).approve(proxy.address, E18(1000000))
        await expect(proxy.connect(alice).teeStake(E18(1000000))).not.to.be.reverted;
        await expect(proxy.connect(alice).teeReportAttestations(["test"])).not.to.be.reverted;
        await expect(proxy.connect(alice).teeUnstake()).to.be.reverted;
        await coordinator.callback(1, [123456789])

        const hours6 = 6 * 60 * 60;
        await time.increase(hours6);
        await expect(proxy.connect(alice).teeUnstake()).not.to.be.reverted;
    });

    it("Node", async function () {
        let alice = signers[1]

        await nft.connect(alice).mint();

        await expect(proxy.connect(alice).nodeEnter(alice.address)).to.be.rejected;

        await expect(proxy.connect(alice).delegate(1, alice.address)).not.to.be.reverted;

        await expect(proxy.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;

        await expect(proxy.connect(alice).nodeExit()).not.to.be.reverted

    });

    it("Report", async function () {
        let owner = signers[0]
        let alice = signers[1]

        await nft.connect(alice).mint();
        await expect(proxy.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
        await expect(proxy.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;

        await expect(proxy.modifyTeeRole(owner.address, true)).not.to.be.reverted;
        await carv.approve(proxy.address, E18(1000000))
        await expect(proxy.teeStake(E18(1000000))).not.to.be.reverted;
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

    it("Slash", async function () {
        let owner = signers[0]
        let alice = signers[1]

        await nft.connect(alice).mint();
        await expect(proxy.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
        await expect(proxy.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;

        await expect(proxy.modifyTeeRole(owner.address, true)).not.to.be.reverted;
        await carv.approve(proxy.address, E18(1000000))
        await expect(proxy.teeStake(E18(1000000))).not.to.be.reverted;
        await expect(proxy.teeReportAttestations(["test"])).not.to.be.reverted;
        await coordinator.callback(1, [123456789])

        await proxy.connect(alice).nodeReportVerification(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")),
            0,
            2
        )

        await expect(proxy.connect(alice).teeSlash(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"))
        )).to.be.reverted;

        const minutes30 = 30 * 60;
        await time.increase(minutes30);

        await expect(proxy.connect(alice).teeSlash(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"))
        )).not.to.be.reverted;

        // console.log(await proxy.attestations(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"))))
        // console.log(await proxy.nodeInfos(alice.address))
        // console.log(await proxy.teeStakeInfos(owner.address))
    });

    it("Claim", async function () {
        let owner = signers[0]
        let alice = signers[1]

        await carv.approve(vault.address, E18(250000000))
        await vault.rewardsInit()

        await nft.connect(alice).mint();
        await expect(proxy.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
        await expect(proxy.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;

        await expect(proxy.modifyTeeRole(owner.address, true)).not.to.be.reverted;
        await carv.approve(proxy.address, E18(1000000))
        await expect(proxy.teeStake(E18(1000000))).not.to.be.reverted;
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

        await nft.connect(alice).mint();
        await nft.connect(bob).mint();
        await nft.connect(owner).mint();

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
});