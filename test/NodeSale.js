const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");
const { E, E18, deployNodeSale} = require("./Common")

describe("NodeSale", function () {
    let owner, receiver, alice, bob, carv, nodeSale, carvAggregator, ethAggregator

    beforeEach(async function () {
        [owner, receiver, alice, bob, carv, nodeSale, carvAggregator, ethAggregator] = await deployNodeSale()
    })

    it("Aggregator", async function () {

        expect(await carvAggregator.decimals()).to.equal(8);
        expect(await carvAggregator.description()).to.equal('CARV / USD');
        expect(await carvAggregator.version()).to.equal(1);

        await expect(carvAggregator.connect(alice).updateData(123456)).to.be.reverted
        await expect(carvAggregator.updateData(123456)).not.to.be.reverted

        expect( (await carvAggregator.latestRoundData()).roundId ).to.equal(1);
        expect( (await carvAggregator.latestRoundData()).answer ).to.equal(123456);
        expect( (await carvAggregator.latestRoundData()).startedAt ).to.equal(await time.latest());
        expect( (await carvAggregator.latestRoundData()).updatedAt ).to.equal(await time.latest());
        expect( (await carvAggregator.latestRoundData()).answeredInRound ).to.equal(1);

        expect( (await carvAggregator.getRoundData(1)).answer ).to.equal(123456);

        await expect(carvAggregator.updateData(654321)).not.to.be.reverted
        expect( (await carvAggregator.latestRoundData()).roundId ).to.equal(2);
        expect( (await carvAggregator.latestRoundData()).answer ).to.equal(654321);
        expect( (await carvAggregator.latestRoundData()).startedAt ).to.equal(await time.latest());
        expect( (await carvAggregator.latestRoundData()).updatedAt ).to.equal(await time.latest());
        expect( (await carvAggregator.latestRoundData()).answeredInRound ).to.equal(2);
    });

    it("Price", async function () {
        await expect(carvAggregator.updateData(80000000)).not.to.be.reverted
        await expect(ethAggregator.updateData(300000000000)).not.to.be.reverted

        console.log(await nodeSale.usd2carv(E18(1000)))
        console.log( await nodeSale.usd2eth(E18(1000)))

        await expect(carvAggregator.updateData(92431230)).not.to.be.reverted
        await expect(ethAggregator.updateData(346284000000)).not.to.be.reverted

        console.log(await nodeSale.usd2carv(E18(1300)))
        console.log( await nodeSale.usd2eth(E18(1300)))
    });

    it("Node Sale(by CARV)", async function () {
        await expect(carvAggregator.updateData(80000000)).not.to.be.reverted
        await expect(ethAggregator.updateData(300000000000)).not.to.be.reverted

        await carv.transfer(alice.address, E18(10000000))
        await carv.connect(alice).approve(nodeSale.address, E18(10000000))
        await nodeSale.connect(alice).purchase(1, 0)

        expect( await nodeSale.purchasedCount() ).to.equal(1);
        expect( await nodeSale.currentUnitIndex() ).to.equal(0);

        console.log(await carv.balanceOf(alice.address))
        console.log(await carv.balanceOf(receiver.address))

        await expect(nodeSale.connect(alice).purchase(1000, 0)).to.be.reverted
        await expect(nodeSale.connect(alice).purchase(999, 0)).not.to.be.reverted

        expect( await nodeSale.purchasedCount() ).to.equal(1000);
        expect( await nodeSale.currentUnitIndex() ).to.equal(1);

        console.log(await carv.balanceOf(alice.address))
        console.log(await carv.balanceOf(receiver.address))
    });

    it("Node Sale(by ETH)", async function () {
        await expect(carvAggregator.updateData(80000000)).not.to.be.reverted
        await expect(ethAggregator.updateData(300000000000)).not.to.be.reverted

        await expect(nodeSale.connect(alice).purchase(1, 1)).to.be.reverted
        await expect(nodeSale.connect(alice).purchase(1, 1, {value: E18(1)})).not.to.be.reverted

        expect( await nodeSale.purchasedCount() ).to.equal(1);
        expect( await nodeSale.currentUnitIndex() ).to.equal(0);

        console.log(await ethers.provider.getBalance(alice.address))
        console.log(await ethers.provider.getBalance(receiver.address))
    });

});