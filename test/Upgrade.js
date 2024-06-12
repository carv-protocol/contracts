const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { deployAll} = require("./Common")

describe("Upgrade", function () {
    let carv, veCarv, nft, vault, setting, vrf, proxy, service, coordinator, signers

    beforeEach(async function () {
        [carv, veCarv, nft, vault, setting, vrf, proxy, service, coordinator, signers] = await deployAll()
    })

    it("Upgrade", async function () {
        const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
        let adminAddr = await upgrades.erc1967.getAdminAddress(proxy.address)
        let proxyAdmin = await ProxyAdmin.attach(adminAddr)

        await expect(
            proxyAdmin.upgradeAndCall(proxy.address, service.address, ethers.utils.toUtf8Bytes(""))
        ).not.to.be.reverted;
    });

});