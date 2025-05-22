const { time } = require("@nomicfoundation/hardhat-network-helpers");
const hre = require("hardhat");
const { expect } = require("chai");
const { E, E18, deployStakingCampaign} = require("./Common")

describe("veCarvsCampaign", function () {
    let carv, veCarvs, stakingCampaign, owner, alice, bob;

    async function increaseToEpochBegin() {
        let now = await time.latest()
        let epochDuration = await veCarvs.DURATION_PER_EPOCH()
        let delta = epochDuration - now % epochDuration
        await time.increase(delta);
    }

    beforeEach(async function () {
        [carv, veCarvs, stakingCampaign, owner, alice, bob] = await deployStakingCampaign();

        await carv.approve(veCarvs.address, E18(100000000))
        await veCarvs.depositRewardToken(E18(1000000))
    })

    it("deposit", async function () {

        await time.increase(3600*24*16);
        await increaseToEpochBegin()
        console.log(await veCarvs.epoch())

        await expect(veCarvs.deposit(E18(1000), 3600*24*30)).not.to.be.reverted;
        console.log(await stakingCampaign.highestAmount(owner.address))

        await time.increase(3600*24*5);
        console.log(await stakingCampaign.highestAmount(owner.address))

        await time.increase(3600*24*5);
        console.log(await stakingCampaign.highestAmount(owner.address))

        await expect(veCarvs.deposit(E18(1000), 3600*24*30)).not.to.be.reverted;

        await time.increase(3600*24*5);
        console.log(await stakingCampaign.highestAmount(owner.address))

        await expect(stakingCampaign.mint(1)).not.to.be.reverted;
        await expect(stakingCampaign.mint(2)).to.be.reverted;
        await expect(stakingCampaign.mint(3)).to.be.reverted;
        await expect(stakingCampaign.mint(4)).to.be.reverted;
    });

});