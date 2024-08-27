const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { E, E18, deployToken} = require("./Common")

describe("veCarvToken", function () {
    let carv, veCarv, owner, alice, bob;

    beforeEach(async function () {
        [carv, veCarv, owner, alice, bob] = await deployToken();

        await veCarv.setTreasuryAddress(bob.address)
    })

    it("mint", async function () {
        expect(await carv.balanceOf(owner.address)).to.equal(E18(1000000000));
    });

    it("deposit", async function () {
        await carv.approve(veCarv.address, E18(10000))
        await expect(veCarv.deposit(E18(1000), owner.address)).to.be.reverted
        await veCarv.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DEPOSITOR_ROLE")), owner.address);
        await expect(veCarv.deposit(E18(1000), owner.address)).not.to.be.reverted
        expect(await veCarv.balanceOf(owner.address)).to.equal(E18(1000));
        await expect(veCarv.deposit(E18(1000), alice.address)).not.to.be.reverted
        expect(await veCarv.balanceOf(alice.address)).to.equal(E18(1000));
    });

    it("withdraw", async function () {
        await veCarv.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DEPOSITOR_ROLE")), owner.address);
        await expect(carv.approve(veCarv.address, E18(10000))).not.to.be.reverted
        await expect(veCarv.deposit(E18(1000), owner.address)).not.to.be.reverted

        await expect(veCarv.withdraw(E18(100), 0)).to.be.reverted
        await expect(veCarv.withdraw(E18(100), 24*3600)).to.be.reverted
        await expect(veCarv.withdraw(E18(100), 24*3600*1000)).to.be.reverted
        await expect(veCarv.withdraw(E(9, 17), 24*3600*15)).to.be.reverted
        await expect(veCarv.withdraw(E18(1001), 24*3600*15)).to.be.reverted

        await expect(veCarv.withdraw(E18(100), 24*3600*15)).not.to.be.reverted
        expect(await veCarv.balanceOf(owner.address)).to.equal(E18(900));
        expect((await veCarv.withdrawInfos(1)).withdrawer).to.equal(owner.address);
        expect((await veCarv.withdrawInfos(1)).amount).to.equal(E18(100));
        expect((await veCarv.withdrawInfos(1)).canceledOrClaimed).to.equal(false);
        expect((await veCarv.withdrawInfos(1)).claimAmount).to.equal(E18(99).mul(25).div(100));
        expect((await veCarv.withdrawInfos(1)).endAt).to.equal( (await time.latest()) + 24*3600*15 );

        await expect(veCarv.connect(alice).cancelWithdraw(1)).to.be.reverted
        await expect(veCarv.cancelWithdraw(2)).to.be.reverted
        await expect(veCarv.cancelWithdraw(1)).not.to.be.reverted
        await expect(veCarv.cancelWithdraw(1)).to.be.reverted
        expect(await veCarv.balanceOf(owner.address)).to.equal(E18(1000));
        expect((await veCarv.withdrawInfos(1)).canceledOrClaimed).to.equal(true);
    });

    it("claim", async function () {
        async function depositAndWithdraw(duration) {
            await veCarv.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DEPOSITOR_ROLE")), alice.address);
            await expect(carv.transfer(alice.address, E18(1000))).not.to.be.reverted
            await expect(carv.connect(alice).approve(veCarv.address, E18(1000))).not.to.be.reverted
            await expect(veCarv.connect(alice).deposit(E18(1000), alice.address)).not.to.be.reverted
            expect(await veCarv.balanceOf(alice.address)).to.equal(E18(1000))
            await expect(veCarv.connect(alice).withdraw(E18(1000), duration)).not.to.be.reverted
        }

        const days15 = 15 * 24 * 60 * 60;
        const days90 = 90 * 24 * 60 * 60;
        const days150 = 150 * 24 * 60 * 60;

        await depositAndWithdraw(days15)
        await expect(veCarv.connect(alice).claim(1)).to.be.reverted;
        await expect(veCarv.connect(bob).claim(1)).to.be.reverted;
        await time.increase(days15);
        await expect(veCarv.connect(alice).claim(1)).not.to.be.reverted;
        await expect(veCarv.connect(alice).claim(1)).to.be.reverted;
        expect((await veCarv.withdrawInfos(1)).canceledOrClaimed).to.equal(true);
        expect(await veCarv.balanceOf(alice.address)).to.equal(0)
        expect(await carv.balanceOf(alice.address)).to.equal(E18(999).mul(25).div(100))
        expect(await carv.balanceOf(bob.address)).to.equal(E18(1000).sub(E18(999).mul(25).div(100)))
        expect(await carv.connect(alice).transfer(owner.address, E18(999).mul(25).div(100)))

        await depositAndWithdraw(days90)
        await expect(veCarv.connect(alice).claim(2)).to.be.reverted;
        await time.increase(days90);
        await expect(veCarv.connect(alice).claim(2)).not.to.be.reverted;
        expect(await veCarv.balanceOf(alice.address)).to.equal(0)
        expect(await carv.balanceOf(alice.address)).to.equal(E18(999).mul(60).div(100))
        expect(await carv.balanceOf(bob.address)).to.equal(
            E18(1000).sub(E18(999).mul(25).div(100)).add(E18(1000).sub(E18(999).mul(60).div(100))))
        expect(await carv.connect(alice).transfer(owner.address, E18(999).mul(60).div(100)))

        await depositAndWithdraw(days150)
        await expect(veCarv.connect(alice).claim(3)).to.be.reverted;
        await time.increase(days150);
        await expect(veCarv.connect(alice).claim(3)).not.to.be.reverted;
        expect(await veCarv.balanceOf(alice.address)).to.equal(0)
        expect(await carv.balanceOf(alice.address)).to.equal(E18(999))
    });
});