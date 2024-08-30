const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { E, E18, deployVault} = require("./Common")

describe("Vault", function () {
    let owner, service, alice, vault, carv, veCarv
    const CarvTotalRewards = E18(249998940)

    beforeEach(async function () {
        [owner, service, alice, vault, carv, veCarv] = await deployVault()
    })

    it("RewardByDate", async function () {
        expect(await vault.totalRewardByDate(0)).to.equal(E18(385850));
        expect(await vault.totalRewardByDate(180)).to.equal(E18(385850));
        expect(await vault.totalRewardByDate(360)).to.equal(E18(289387));
        expect(await vault.totalRewardByDate(540)).to.equal(E18(217040));
        expect(await vault.totalRewardByDate(720)).to.equal(E18(162780));
    });

    it("Vault", async function () {

        const ZeroAddress = "0x0000000000000000000000000000000000000000"

        await expect(carv.approve(vault.address, E18(200000000))).not.to.be.reverted
        await expect(vault.rewardsDeposit(CarvTotalRewards)).to.be.reverted
        await expect(carv.approve(vault.address, E18(250000000))).not.to.be.reverted
        await expect(vault.connect(service).rewardsDeposit(CarvTotalRewards)).to.be.reverted
        await expect(vault.connect(alice).rewardsDeposit(CarvTotalRewards)).to.be.reverted
        await expect(vault.connect(service).rewardsWithdraw(alice.address, E18(1))).to.be.reverted
        await expect(vault.rewardsDeposit(CarvTotalRewards)).not.to.be.reverted

        await expect(vault.connect(owner).foundationWithdraw(veCarv.address, 1)).to.be.reverted
        await expect(vault.connect(owner).foundationWithdraw(ZeroAddress, 1)).to.be.reverted

        await expect(vault.connect(service).rewardsWithdraw(alice.address, E18(249998941))).to.be.reverted
        await expect(vault.connect(owner).rewardsWithdraw(alice.address, E18(1))).to.be.reverted
        await expect(vault.connect(alice).rewardsWithdraw(alice.address, E18(1))).to.be.reverted
        await expect(vault.connect(service).rewardsWithdraw(alice.address, E18(200000000))).not.to.be.reverted
        await expect(vault.connect(service).rewardsWithdraw(alice.address, E18(49998940))).not.to.be.reverted
        await expect(vault.connect(service).rewardsWithdraw(alice.address, E18(1))).to.be.reverted

    });

    it("Foundation", async function () {
        const ZeroAddress = "0x0000000000000000000000000000000000000000"

        await expect(carv.approve(vault.address, E18(250000000))).not.to.be.reverted
        await expect(vault.rewardsDeposit(CarvTotalRewards)).not.to.be.reverted

        await expect(vault.connect(owner).foundationWithdraw(veCarv.address, 1)).to.be.reverted
        await expect(vault.connect(owner).foundationWithdraw(ZeroAddress, 1)).to.be.reverted

        await expect(carv.connect(owner).transfer(vault.address, E18(1000))).not.to.be.reverted
        await expect(vault.connect(owner).foundationWithdraw(carv.address, E18(1001))).to.be.reverted
        await expect(vault.connect(owner).foundationWithdraw(carv.address, E18(1000))).not.to.be.reverted

        await owner.sendTransaction({
            to: vault.address,
            value: E18(100)
        });

        await expect(vault.connect(owner).foundationWithdraw(ZeroAddress, E18(101))).to.be.reverted
        await expect(vault.connect(owner).foundationWithdraw(ZeroAddress, E18(100))).not.to.be.reverted

        await expect(carv.connect(owner).transfer(vault.address, E18(1000))).not.to.be.reverted
        await expect(vault.connect(owner).foundationWithdraw(carv.address, E18(500))).not.to.be.reverted

        await expect(vault.connect(owner).changeFoundation(alice.address)).not.to.be.reverted

        await expect(vault.connect(owner).foundationWithdraw(carv.address, E18(500))).to.be.reverted
        await expect(vault.connect(alice).foundationWithdraw(carv.address, E18(500))).not.to.be.reverted
    })


});