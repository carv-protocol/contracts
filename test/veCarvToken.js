const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { E, E18, deployToken} = require("./Common")

describe("veCarvToken", function () {

    it("mint", async function () {
        const { carv, veCarv, owner } = await deployToken();
        expect(await carv.balanceOf(owner.address)).to.equal(E18(1000000000));
    });

    it("deposit", async function () {
        const { carv, veCarv, owner } = await deployToken();
        await carv.approve(veCarv.address, E18(1000))
        await veCarv.deposit(E18(1000), owner.address);
        expect(await veCarv.balanceOf(owner.address)).to.equal(E18(1000));
    });

    it("withdraw", async function () {
        const { carv, veCarv, owner } = await deployToken();
        await expect(carv.approve(veCarv.address, E18(1000))).not.to.be.reverted
        await expect(veCarv.deposit(E18(1000), owner.address)).not.to.be.reverted
        await expect(veCarv.withdraw(E18(100))).not.to.be.reverted
        expect(await veCarv.balanceOf(owner.address)).to.equal(E18(900));
        expect((await veCarv.withdrawInfos(1)).amount).to.equal(E18(99));
        expect((await veCarv.withdrawInfos(1)).canceledOrClaimed).to.equal(false);

        await expect(veCarv.cancelWithdraw(1)).not.to.be.reverted
        expect(await veCarv.balanceOf(owner.address)).to.equal(E18(999));
        expect((await veCarv.withdrawInfos(1)).canceledOrClaimed).to.equal(true);
    });

    it("claim", async function () {
        async function depositAndWithdraw() {
            await expect(carv.transfer(alice.address, E18(1000))).not.to.be.reverted
            await expect(carv.connect(alice).approve(veCarv.address, E18(1000))).not.to.be.reverted
            await expect(veCarv.connect(alice).deposit(E18(1000), alice.address)).not.to.be.reverted
            expect(await veCarv.balanceOf(alice.address)).to.equal(E18(1000))
            await expect(veCarv.connect(alice).withdraw(E18(1000))).not.to.be.reverted
        }

        const { carv, veCarv, owner, alice } = await deployToken();

        const days15 = 15 * 24 * 60 * 60;
        const days90 = 90 * 24 * 60 * 60;
        const days150 = 150 * 24 * 60 * 60;

        await depositAndWithdraw()
        await time.increase(days15);
        await expect(veCarv.connect(alice).claim(1)).not.to.be.reverted;
        await expect(await carv.balanceOf(alice.address)).to.equal(E(24975, 16))
        await expect(await carv.connect(alice).transfer(owner.address, E(24975, 16)))

        await depositAndWithdraw()
        await time.increase(days90);
        await expect(veCarv.connect(alice).claim(2)).not.to.be.reverted;
        await expect(await carv.balanceOf(alice.address)).to.equal(E(59940, 16))
        await expect(await carv.connect(alice).transfer(owner.address, E(59940, 16)))

        await depositAndWithdraw()
        await time.increase(days150);
        await expect(veCarv.connect(alice).claim(3)).not.to.be.reverted;
        await expect(await carv.balanceOf(alice.address)).to.equal(E(99900, 16))
    });
});