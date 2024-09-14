const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { E, E18, deploySBT} = require("./Common")

describe("SBT", function () {
    let owner, alice, bob, cindy, sbt

    beforeEach(async function () {
        [owner, alice, bob, cindy, sbt] = await deploySBT()
    })

    it("authorize", async function () {
        await expect(sbt.connect(alice).authorize(bob.address)).to.be.reverted
        await sbt.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("AIRDROP_ROLE")), alice.address);
        await expect(sbt.connect(alice).authorize(bob.address)).not.to.be.reverted
    });

    it("claim", async function () {
        await sbt.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("AIRDROP_ROLE")), alice.address);
        await expect(sbt.connect(alice).authorize(bob.address)).not.to.be.reverted

        await expect(sbt.connect(alice).claim()).to.be.reverted
        await expect(sbt.connect(bob).claim()).not.to.be.reverted
        await expect(sbt.connect(bob).claim()).to.be.reverted

        expect(await sbt.balanceOf(bob.address)).to.equal(1);
        expect(await sbt.ownerOf(1)).to.equal(bob.address);

        await expect(sbt.connect(bob).transferFrom(bob.address, alice.address, 1)).to.be.reverted
        // await expect(sbt.connect(bob).safeTransferFrom(bob.address, alice.address, 1)).to.be.reverted
        // await expect(sbt.connect(bob).safeTransferFrom(bob.address, alice.address, 1, "")).to.be.reverted
    });

    it("tokenURI", async function () {

        await expect(sbt.connect(alice).setURI("test-uri")).to.be.reverted
        await expect(sbt.setURI("test-uri")).not.to.be.reverted

        await sbt.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("AIRDROP_ROLE")), alice.address);
        await expect(sbt.connect(alice).authorize(bob.address)).not.to.be.reverted
        await expect(sbt.connect(bob).claim()).not.to.be.reverted

        expect(await sbt.tokenURI(1)).to.equal("test-uri");
    });

});