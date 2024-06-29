const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { E, E18, deployAll, signNodeEnter, signNodeExit, signModifyCommission, signSetRewardClaimer} = require("./Common")

describe("Service", function () {
    let carv, veCarv, nft, vault, setting, vrf, proxy, service, coordinator, signers

    beforeEach(async function () {
        [carv, veCarv, nft, vault, setting, vrf, proxy, service, coordinator, signers] = await deployAll()
    })

    // it("Reward", async function () {
    //     let alice = signers[1]
    //     await nft.mint(alice.address, 1, {code:"", price: 0, tier: 0});
    //
    //     let now = await time.latest()
    //     await time.increase(1719792000 - now)
    //
    //     await expect(proxy.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
    //     await expect(proxy.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;
    //     await proxy.connect(alice).nodeModifyCommissionRate(100)
    //
    //     const hours8 = 8 * 60 * 60;
    //     const hours24 = 24 * 60 * 60;
    //
    //     await proxy.connect(alice).nodeReportDailyActive(alice.address)
    //     await printReward(proxy, alice)
    //
    //     await time.increase(hours8);
    //     await proxy.connect(alice).nodeReportDailyActive(alice.address)
    //     await printReward(proxy, alice)
    //
    //     await time.increase(hours24);
    //     await proxy.connect(alice).nodeReportDailyActive(alice.address)
    //     await proxy.connect(alice).nodeReportDailyActive(alice.address)
    //     await proxy.connect(alice).nodeReportDailyActive(alice.address)
    //     await printReward(proxy, alice)
    //     await proxy.connect(alice).nodeReportDailyActive(alice.address)
    //     await printReward(proxy, alice)
    //     await proxy.connect(alice).nodeReportDailyActive(alice.address)
    //     await printReward(proxy, alice)
    //
    //     await time.increase(hours24);
    //     await time.increase(hours24);
    //
    //     await proxy.connect(alice).nodeReportDailyActive(alice.address)
    //     await printReward(proxy, alice)
    //
    //     await time.increase(hours24);
    //
    //     await proxy.connect(alice).nodeReportDailyActive(alice.address)
    //     await printReward(proxy, alice)
    //
    //     await time.increase(hours24);
    //     await time.increase(hours24);
    //     await time.increase(hours24);
    //
    //     await proxy.connect(alice).nodeReportDailyActive(alice.address)
    //     await printReward(proxy, alice)
    // });

    // it("2 Reward", async function () {
    //     let alice = signers[1]
    //     let bob = signers[2]
    //
    //     await nft.mint(alice.address, 1, {code:"", price: 0, tier: 0});
    //     await nft.mint(bob.address, 1, {code:"", price: 0, tier: 0});
    //
    //     let now = await time.latest()
    //     await time.increase(1719792000 - now)
    //
    //     await expect(proxy.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
    //     await expect(proxy.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;
    //     await expect(proxy.connect(bob).delegate(2, bob.address)).not.to.be.reverted;
    //     await expect(proxy.connect(bob).nodeEnter(bob.address)).not.to.be.reverted;
    //     await proxy.connect(alice).nodeModifyCommissionRate(100)
    //     await proxy.connect(bob).nodeModifyCommissionRate(100)
    //
    //     const hours8 = 8 * 60 * 60;
    //     const hours24 = 24 * 60 * 60;
    //
    //     await time.increase(hours8);
    //     await proxy.connect(alice).nodeReportDailyActive(alice.address)
    //     await printReward(proxy, alice)
    //
    //     await time.increase(hours24);
    //
    //     await proxy.connect(bob).nodeReportDailyActive(bob.address)
    //
    //     await time.increase(hours24);
    //
    //     await proxy.connect(alice).nodeReportDailyActive(alice.address)
    //     await proxy.connect(bob).nodeReportDailyActive(bob.address)
    //
    //     await time.increase(hours24);
    //
    //     await proxy.connect(bob).nodeReportDailyActive(bob.address)
    //
    //     await printReward(proxy, alice)
    //     await printReward(proxy, bob)
    // });

    // it("5 Reward", async function () {
    //     let s1 = signers[1]
    //     let s2 = signers[2]
    //     let s3 = signers[3]
    //     let s4 = signers[4]
    //     let s5 = signers[5]
    //
    //     await nft.mint(s1.address, 1, {code:"", price: 0, tier: 0});
    //     await nft.mint(s2.address, 1, {code:"", price: 0, tier: 0});
    //     await nft.mint(s3.address, 1, {code:"", price: 0, tier: 0});
    //     await nft.mint(s4.address, 1, {code:"", price: 0, tier: 0});
    //     await nft.mint(s5.address, 1, {code:"", price: 0, tier: 0});
    //
    //     let now = await time.latest()
    //     await time.increase(1719792000 - now)
    //
    //     await expect(proxy.connect(s1).delegate(1, s1.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s1).nodeEnter(s1.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s2).delegate(2, s2.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s2).nodeEnter(s2.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s3).delegate(3, s3.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s3).nodeEnter(s3.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s4).delegate(4, s4.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s4).nodeEnter(s4.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s5).delegate(5, s5.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s5).nodeEnter(s5.address)).not.to.be.reverted;
    //     await proxy.connect(s1).nodeModifyCommissionRate(100)
    //     await proxy.connect(s2).nodeModifyCommissionRate(100)
    //     await proxy.connect(s3).nodeModifyCommissionRate(100)
    //     await proxy.connect(s4).nodeModifyCommissionRate(100)
    //     await proxy.connect(s5).nodeModifyCommissionRate(100)
    //
    //     const hours8 = 8 * 60 * 60;
    //     const hours24 = 24 * 60 * 60;
    //
    //     await time.increase(hours8);
    //     await proxy.connect(s1).nodeReportDailyActive(s1.address)
    //     await proxy.connect(s2).nodeReportDailyActive(s2.address)
    //     await proxy.connect(s3).nodeReportDailyActive(s3.address)
    //
    //     await time.increase(hours24);
    //
    //     await proxy.nodeReportDailyActive(s1.address)
    //     await proxy.nodeReportDailyActive(s2.address)
    //     await proxy.nodeReportDailyActive(s3.address)
    //     await proxy.nodeReportDailyActive(s4.address)
    //     await proxy.nodeReportDailyActive(s5.address)
    //     await printReward(proxy, s1)
    //     await printReward(proxy, s2)
    //     await printReward(proxy, s3)
    //     await printReward(proxy, s4)
    //     await printReward(proxy, s5)
    //
    //     await time.increase(hours24);
    //
    //     await proxy.nodeReportDailyActive(s1.address)
    //     await proxy.nodeReportDailyActive(s2.address)
    //     await proxy.nodeReportDailyActive(s3.address)
    //     await proxy.nodeReportDailyActive(s4.address)
    //     await proxy.nodeReportDailyActive(s5.address)
    //     await printReward(proxy, s1)
    //     await printReward(proxy, s2)
    //     await printReward(proxy, s3)
    //     await printReward(proxy, s4)
    //     await printReward(proxy, s5)
    // })

    // it("delegate reward", async function () {
    //     let s1 = signers[1]
    //     let s2 = signers[2]
    //
    //     await nft.mint(s1.address, 2, {code:"", price: 0, tier: 0});
    //     await nft.mint(s2.address, 8, {code:"", price: 0, tier: 0});
    //
    //     let now = await time.latest()
    //     await time.increase(1719792000 - now)
    //
    //     await expect(proxy.connect(s1).delegate(1, s1.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s1).delegate(2, s1.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s1).nodeEnter(s1.address)).not.to.be.reverted;
    //
    //     await expect(proxy.connect(s2).delegate(3, s2.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s2).delegate(4, s2.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s2).delegate(5, s2.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s2).delegate(6, s2.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s2).delegate(7, s2.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s2).delegate(8, s2.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s2).delegate(9, s2.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s2).delegate(10, s2.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s2).nodeEnter(s2.address)).not.to.be.reverted;
    //
    //     await proxy.connect(s1).nodeModifyCommissionRate(100)
    //     await proxy.connect(s2).nodeModifyCommissionRate(100)
    //
    //     const hours8 = 8 * 60 * 60;
    //     const hours24 = 24 * 60 * 60;
    //
    //     await time.increase(hours8);
    //     await proxy.connect(s1).nodeReportDailyActive(s1.address)
    //     await proxy.connect(s2).nodeReportDailyActive(s2.address)
    //
    //     await time.increase(hours24);
    //
    //     await proxy.nodeReportDailyActive(s1.address)
    //     await proxy.nodeReportDailyActive(s2.address)
    //     await printReward(proxy, s1)
    //     await printReward(proxy, s2)
    //
    //     await time.increase(hours24);
    //
    //     await proxy.nodeReportDailyActive(s1.address)
    //     await proxy.nodeReportDailyActive(s2.address)
    //     await printReward(proxy, s1)
    //     await printReward(proxy, s2)
    // })

    // it("claim", async function() {
    //     await carv.approve(vault.address, E18(250000000))
    //     await vault.rewardsInit()
    //
    //     let s1 = signers[1]
    //     let s2 = signers[2]
    //     let s3 = signers[3]
    //     let claimer = signers[4]
    //
    //     await nft.mint(s2.address, 1, {code:"", price: 0, tier: 0});
    //     await nft.mint(s3.address, 1, {code:"", price: 0, tier: 0});
    //
    //     let now = await time.latest()
    //     await time.increase(1719792000 - now)
    //
    //     await expect(proxy.connect(s2).delegate(1, s1.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s3).delegate(2, s1.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s1).nodeEnter(s1.address)).not.to.be.reverted;
    //
    //     await proxy.connect(s1).nodeModifyCommissionRate(100)
    //
    //     const hours8 = 8 * 60 * 60;
    //     const hours24 = 24 * 60 * 60;
    //
    //     await time.increase(hours8);
    //     await proxy.nodeReportDailyActive(s1.address)
    //     await time.increase(hours24);
    //
    //     await proxy.nodeReportDailyActive(s1.address)
    //     await printReward(proxy, s1)
    //     await printTokenReward(proxy, 1)
    //     await printTokenReward(proxy, 2)
    //
    //     await proxy.connect(s1).nodeClaim(s1.address)
    //     await printReward(proxy, s1)
    //
    //     await proxy.connect(s2).claimRewards(1)
    //     await proxy.connect(s3).claimRewards(2)
    //
    //     await printTokenReward(proxy, 1)
    //     await printTokenReward(proxy, 2)
    // } )

    // it("change delegation", async function () {
    //     await carv.approve(vault.address, E18(250000000))
    //     await vault.rewardsInit()
    //
    //     let s1 = signers[1]
    //     let s2 = signers[2]
    //     let s3 = signers[3]
    //
    //     await nft.mint(s1.address, 1, {code:"", price: 0, tier: 0});
    //     await nft.mint(s2.address, 1, {code:"", price: 0, tier: 0});
    //     await nft.mint(s3.address, 1, {code:"", price: 0, tier: 0});
    //
    //     let now = await time.latest()
    //     await time.increase(1719792000 - now)
    //
    //     await expect(proxy.connect(s1).delegate(1, s1.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s2).delegate(2, s2.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s3).delegate(3, s1.address)).not.to.be.reverted;
    //
    //     await expect(proxy.connect(s1).nodeEnter(s1.address)).not.to.be.reverted;
    //     await expect(proxy.connect(s2).nodeEnter(s2.address)).not.to.be.reverted;
    //
    //     await proxy.connect(s1).nodeModifyCommissionRate(1000)
    //     await proxy.connect(s2).nodeModifyCommissionRate(1000)
    //
    //     const hours8 = 8 * 60 * 60;
    //     const hours24 = 24 * 60 * 60;
    //
    //     await time.increase(hours8);
    //     await proxy.nodeReportDailyActive(s1.address)
    //     await proxy.nodeReportDailyActive(s2.address)
    //
    //     await time.increase(hours24);
    //     await proxy.nodeReportDailyActive(s1.address)
    //     await proxy.nodeReportDailyActive(s2.address)
    //
    //     await printReward(proxy, s1)
    //     await printReward(proxy, s2)
    //     await printTokenReward(proxy, 3)
    //
    //     await proxy.connect(s3).redelegate(3, s2.address)
    //     await printTokenReward(proxy, 3)
    //
    //     await time.increase(hours24);
    //     await proxy.nodeReportDailyActive(s1.address)
    //     await proxy.nodeReportDailyActive(s2.address)
    //
    //     await printReward(proxy, s1)
    //     await printReward(proxy, s2)
    //     await printTokenReward(proxy, 3)
    //
    //
    //     await proxy.connect(s3).claimRewards(3)
    //     await printTokenReward(proxy, 3)
    // })

});

async function printReward(proxy, user) {
    console.log("total", divE18((await proxy.nodeInfos(user.address)).selfTotalRewards),
        "claim", divE18((await proxy.nodeInfos(user.address)).selfClaimedRewards),
        "delegate", divE18((await proxy.nodeInfos(user.address)).delegationRewards)
    )
}

async function printTokenReward(proxy, tokenID) {
    console.log("initialRewards", divE18((await proxy.tokenRewardInfos(tokenID)).initialRewards),
        "totalRewards", divE18((await proxy.tokenRewardInfos(tokenID)).totalRewards),
        "claimedRewards", divE18((await proxy.tokenRewardInfos(tokenID)).claimedRewards)
    )
}

function divE18(x) {
    return x.div(ethers.BigNumber.from("1000000000000000000")).toString()
}