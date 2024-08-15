const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { E, E18, deployToken2} = require("./Common")

describe("veCarvs", function () {

    it("deposit", async function () {
        const { carv, veCarvs, owner } = await deployToken2();
        await carv.approve(veCarvs.address, E18(1000))

        let now = await time.latest()
        let epochDuration = await veCarvs.DURATION_PER_EPOCH()
        let delta = epochDuration - now % epochDuration
        await time.increase(delta);
        await veCarvs.deposit(E18(1000), 3600*24*50);

        expect(await veCarvs.balanceOfAt(owner.address, await time.latest() - 1)).to.equal(E18(2500));
        expect(await veCarvs.totalSupplyAt(await time.latest() - 1)).to.equal(E18(2500));
        expect( (await veCarvs.positions(1)).balance ).to.equal(E18(1000));
    });

    it("withdraw", async function () {
        const { carv, veCarvs, owner } = await deployToken2();
        await carv.approve(veCarvs.address, E18(1000))
        await veCarvs.deposit(E18(1000), 3600*24*10);

        await expect(veCarvs.withdraw(1)).to.be.reverted;

        const days10 = 11 * 24 * 3600;
        await time.increase(days10);

        await expect(veCarvs.withdraw(1)).not.to.be.reverted;
        await expect(veCarvs.withdraw(1)).to.be.reverted;

        expect(await veCarvs.balanceOf(owner.address)).to.equal(0);
        expect(await veCarvs.totalSupply()).to.equal(0);
        expect( (await veCarvs.positions(1)).balance ).to.equal(0);
    });

    it("balance", async function () {
        const { carv, veCarvs, owner } = await deployToken2();
        await carv.approve(veCarvs.address, E18(100))
        const day = 24 * 3600;

        let now = await time.latest()
        let epochDuration = await veCarvs.DURATION_PER_EPOCH()
        let delta = epochDuration - now % epochDuration
        await time.increase(delta);

        await veCarvs.deposit(E18(10), day * 10);
        console.log(await veCarvs.balanceOfAt(owner.address, await time.latest() - 1))

        await time.increase(day-1);
        console.log(await veCarvs.balanceOf(owner.address))
        await time.increase(day*4);
        console.log(await veCarvs.balanceOf(owner.address))

        await veCarvs.deposit(E18(10), day * 10);
        console.log(await veCarvs.balanceOfAt(owner.address, (await time.latest()) - 1))

        await time.increase(day-1);
        console.log(await veCarvs.balanceOf(owner.address))

        await time.increase(day*4);
        console.log(await veCarvs.balanceOf(owner.address))

        await time.increase(day);
        console.log(await veCarvs.balanceOf(owner.address))

        await time.increase(day);
        console.log(await veCarvs.balanceOf(owner.address))

        await time.increase(day);
        console.log(await veCarvs.balanceOf(owner.address))

        await time.increase(day);
        console.log(await veCarvs.balanceOf(owner.address))

        await time.increase(day);
        console.log(await veCarvs.balanceOf(owner.address))

        await time.increase(day);
        console.log(await veCarvs.balanceOf(owner.address))

    });

    it("totalSupply", async function () {
        const { carv, veCarvs, owner, alice } = await deployToken2();
        await carv.transfer(alice.address, E18(100))
        await carv.approve(veCarvs.address, E18(100))
        await carv.connect(alice).approve(veCarvs.address, E18(100))

        const day = 24 * 3600;

        let now = await time.latest()
        let epochDuration = await veCarvs.DURATION_PER_EPOCH()
        let delta = epochDuration - now % epochDuration
        await time.increase(delta);

        await veCarvs.deposit(E18(10), day * 10);
        console.log(await veCarvs.totalSupplyAt(await time.latest() - 1))

        await time.increase(day-1);
        console.log(await veCarvs.totalSupply())
        await time.increase(day*4);
        console.log(await veCarvs.totalSupply())

        await veCarvs.connect(alice).deposit(E18(10), day * 10);
        console.log(await veCarvs.totalSupplyAt(await time.latest() - 1))

        await time.increase(day-1);
        console.log(await veCarvs.totalSupply())

        await time.increase(day*4);
        console.log(await veCarvs.totalSupply())

        await time.increase(day);
        console.log(await veCarvs.totalSupply())

        await time.increase(day);
        console.log(await veCarvs.totalSupply())

        await time.increase(day);
        console.log(await veCarvs.totalSupply())

        await time.increase(day);
        console.log(await veCarvs.totalSupply())

        await time.increase(day);
        console.log(await veCarvs.totalSupply())

        await time.increase(day);
        console.log(await veCarvs.totalSupply())

    });

});