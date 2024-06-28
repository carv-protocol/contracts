const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { E, E18, deployAll, signNodeEnter, signNodeExit, signModifyCommission, signSetRewardClaimer} = require("./Common")

describe("Service", function () {
    let carv, veCarv, nft, vault, setting, vrf, proxy, service, coordinator, signers

    beforeEach(async function () {
        [carv, veCarv, nft, vault, setting, vrf, proxy, service, coordinator, signers] = await deployAll()
    })

    it("Reward", async function () {
        let alice = signers[1]
        let bob = signers[2]

        await nft.mint(alice.address, 1, {code:"", price: 0, tier: 0});
        await nft.mint(bob.address, 1, {code:"", price: 0, tier: 0});

        await expect(proxy.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
        await expect(proxy.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;
        await expect(proxy.connect(bob).delegate(2, bob.address)).not.to.be.reverted;
        await expect(proxy.connect(bob).nodeEnter(bob.address)).not.to.be.reverted;
        await proxy.connect(alice).nodeModifyCommissionRate(100)
        await proxy.connect(bob).nodeModifyCommissionRate(100)

        const hours8 = 8 * 60 * 60;
        await time.increase(hours8);
        await proxy.connect(alice).nodeReportDailyActive(alice.address)
        const hours24 = 24 * 60 * 60;
        await time.increase(hours24);
        await proxy.connect(alice).nodeReportDailyActive(alice.address)
        await proxy.connect(bob).nodeReportDailyActive(bob.address)
        // await time.increase(hours24);
        // await proxy.connect(alice).nodeReportDailyActive(alice.address)

        console.log(await proxy.nodeInfos(alice.address))
        console.log(await proxy.nodeInfos(bob.address))

        // await expect(proxy.connect(alice).nodeClaim()).not.to.be.reverted

        // await proxy.connect(alice).claimRewards(1)

    });




});