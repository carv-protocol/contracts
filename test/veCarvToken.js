const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("veCarvToken", function () {

    function E(x, d) {
        return ethers.BigNumber.from("10").pow(d).mul(x)
    }

    function E18(x) {
        return ethers.BigNumber.from("1000000000000000000").mul(x)
    }

    async function deploy() {
        const [owner, alice, bob] = await ethers.getSigners();

        const CarvToken = await ethers.getContractFactory("CarvToken");
        const veCarvToken = await ethers.getContractFactory("veCarvToken");

        const carv = await CarvToken.deploy(owner.address);
        const veCarv = await veCarvToken.deploy(carv.address, owner.address);

        return { carv, veCarv, owner, alice, bob };
    }

    describe("Carv", function () {
        it("mint", async function () {
            const { carv, veCarv, owner } = await deploy();
            expect(await carv.balanceOf(owner.address)).to.equal(E18(1000000000));
        });
    });

    describe("veCarv", function () {
        it("deposit", async function () {
            const { carv, veCarv, owner } = await deploy();

            await carv.approve(veCarv.address, E18(1000))
            await veCarv.deposit(E18(1000));

            expect(await veCarv.balanceOf(owner.address)).to.equal(E18(1000));
        });

        it("withdraw", async function () {
            const { carv, veCarv, owner } = await deploy();

            await carv.approve(veCarv.address, E18(1000))
            await veCarv.deposit(E18(1000));
            await veCarv.withdraw(E18(100))

            expect(await veCarv.balanceOf(owner.address)).to.equal(E18(900));
            expect((await veCarv.withdrawInfos(1)).amount).to.equal(E18(99));
            expect((await veCarv.withdrawInfos(1)).canceledOrClaimed).to.equal(false);

            await veCarv.cancelWithdraw(1)
            expect(await veCarv.balanceOf(owner.address)).to.equal(E18(999));
            expect((await veCarv.withdrawInfos(1)).canceledOrClaimed).to.equal(true);
        });

        it("claim", async function () {
            const { carv, veCarv, owner, alice } = await deploy();

            await carv.transfer(alice.address, E18(1000));

            await carv.connect(alice).approve(veCarv.address, E18(1000))
            await veCarv.connect(alice).deposit(E18(1000));

            expect(await veCarv.balanceOf(alice.address)).to.equal(E18(1000));
            await veCarv.connect(alice).withdraw(E18(1000))

            const daysLater15 = (await time.latest()) + 15 * 24 * 60 * 60;
            const daysLater90 = (await time.latest()) + 90 * 24 * 60 * 60;
            const daysLater150 = (await time.latest()) + 150 * 24 * 60 * 60;

            await time.increaseTo(daysLater15);
            await expect(veCarv.connect(alice).claim(1)).not.to.be.reverted;
            await expect(await carv.balanceOf(alice.address)).to.equal(E(24975, 16))

        });
    });
});