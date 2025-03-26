const { time } = require("@nomicfoundation/hardhat-network-helpers");
const hre = require("hardhat");
const { expect } = require("chai");
const { E, E18, deployToken3} = require("./Common")

describe("veCarvsi", function () {
    let carv, veCarvsi, owner, alice, bob;

    beforeEach(async function () {
        [carv, veCarvsi, owner, alice, bob] = await deployToken3();
    })

    it("proxy", async function () {
        await expect(veCarvsi.initialize("veCARV(si)", "veCARV(si)", carv.address)).to.be.reverted;

        const ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
        const veCarvTokensi = await hre.ethers.getContractFactory("veCarvsi");

        let adminAddr = await hre.upgrades.erc1967.getAdminAddress(veCarvsi.address)
        let proxyAdmin = await ProxyAdmin.attach(adminAddr)
        let newImpl = await veCarvTokensi.deploy();

        await expect(proxyAdmin.upgradeAndCall(veCarvsi.address, newImpl.address, hre.ethers.utils.toUtf8Bytes(""))).not.to.be.reverted;
    });

    it("deposit", async function () {
        await expect(veCarvsi.depositFor(alice.address, E18(1000))).to.be.reverted;
        await carv.approve(veCarvsi.address, E18(100000000))
        await expect(veCarvsi.depositFor(alice.address, E18(1000))).to.be.reverted;
        await expect(veCarvsi.grantRole(hre.ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DEPOSIT_ROLE")), owner.address)).not.to.be.reverted

        await expect(veCarvsi.depositFor(alice.address, E18(1000))).not.to.be.reverted;
        await expect(veCarvsi.depositFor(bob.address, E18(5000))).not.to.be.reverted;

        console.log(await veCarvsi.balanceOf(alice.address))
        console.log(await veCarvsi.balanceOf(bob.address))
        console.log(await veCarvsi.totalSupply())

    });

    it("withdraw", async function () {
        await carv.approve(veCarvsi.address, E18(100000000))
        await veCarvsi.grantRole(hre.ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DEPOSIT_ROLE")), owner.address)
        await veCarvsi.grantRole(hre.ethers.utils.keccak256(ethers.utils.toUtf8Bytes("WITHDRAW_ROLE")), owner.address)

        await expect(veCarvsi.depositFor(alice.address, E18(1000))).not.to.be.reverted;

        await expect(veCarvsi.withdrawFor(alice.address, E18(1000))).not.to.be.reverted;

        await expect(veCarvsi.withdrawFor(alice.address, E18(500))).to.be.reverted;

    });


});