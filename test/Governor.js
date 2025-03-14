const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { E, E18, deployGovernor} = require("./Common")

describe("Governor", function () {
    let votes, timelock, governor, owner, alice, bob;
    const ZeroAddr = "0x0000000000000000000000000000000000000000"

    beforeEach(async function () {
        [votes, timelock, governor, owner, alice, bob ] = await deployGovernor();
    })

    it("Votes-1", async function () {

        expect(await governor.CLOCK_MODE()).to.equal("mode=blocknumber&from=default");
        expect(await governor.clock()).to.equal(3);

        await votes.update(ZeroAddr, alice.address, 100);
        expect(await votes.balanceOf(alice.address)).to.equal(100);
        expect(await votes.getVotes(alice.address)).to.equal(0);

        await votes.connect(alice).delegate(alice.address)
        expect(await votes.balanceOf(alice.address)).to.equal(100);
        expect(await votes.getVotes(alice.address)).to.equal(100);

        await votes.update(alice.address, bob.address, 50);
        expect(await votes.balanceOf(alice.address)).to.equal(50);
        expect(await votes.getVotes(alice.address)).to.equal(50);
        expect(await votes.getPastVotes(alice.address, 5)).to.equal(100);

        expect(await votes.getPastTotalSupply(5)).to.equal(100);

    });

    it("Votes-2", async function () {

        await votes.update(ZeroAddr, alice.address, 100);
        await votes.update(ZeroAddr, bob.address, 200);

        await votes.connect(alice).delegate(alice.address)
        expect(await votes.getPastTotalSupply(11)).to.equal(300);

        await votes.connect(bob).delegate(alice.address)

        expect(await votes.balanceOf(alice.address)).to.equal(100);
        expect(await votes.getVotes(alice.address)).to.equal(300);

        await votes.update(bob.address, alice.address, 50);
        expect(await votes.balanceOf(alice.address)).to.equal(150);
        expect(await votes.balanceOf(bob.address)).to.equal(150);
        expect(await votes.getVotes(alice.address)).to.equal(300);

        await expect(votes.connect(alice).transfer(bob.address, 100)).to.be.reverted
        await expect(votes.connect(alice).transferFrom(bob.address, alice.address, 100)).to.be.reverted
    });

    it("Propose", async function () {
        await expect(governor.connect(alice).propose([alice.address], [0], ['0x'], "test")).to.be.reverted
        await votes.update(ZeroAddr, alice.address, 100);
        await votes.connect(alice).delegate(alice.address)
        await expect(governor.connect(alice).propose([alice.address], [0], ['0x'], "test")).not.to.be.reverted

        await expect(governor.connect(bob).propose([bob.address], [0], ['0x'], "test")).to.be.reverted
        await governor.updateProposerWhitelist(bob.address, true)
        await expect(governor.connect(bob).propose([bob.address], [0], ['0x'], "test")).not.to.be.reverted
    });
});

