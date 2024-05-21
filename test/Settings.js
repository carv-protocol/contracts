const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Settings", function () {

    function E(x, d) {
        return ethers.BigNumber.from("10").pow(d).mul(x)
    }

    function E18(x) {
        return ethers.BigNumber.from("1000000000000000000").mul(x)
    }

    async function deploy() {
        const [owner] = await ethers.getSigners();
        const Settings = await ethers.getContractFactory("Settings");
        const settings = await Settings.deploy();
        return { settings, owner };
    }

    it("Update", async function () {
        const { settings, owner } = await deploy();

        await expect(await settings.updateSettings({
            maxVrfActiveNodes: 2000,
            nodeMinOnlineDuration: 21600, // 6 hours
            nodeVerifyDuration: 1800,  // 30 minutes
            nodeSlashReward: E18(10) ,  // 10 veCARV
            minTeeStakeAmount: E18(1e5),  // 10,000 CARV
            teeSlashAmount: E18(100),      // 100 veCARV
            teeUnstakeDuration: 21600,   // 6 hours
            nodeMaxMissVerifyCount: 5,
            commissionRate: 100,       // 1%
            maxNodeWeights: 100,
        })).not.to.be.reverted;

        expect(await settings.maxVrfActiveNodes()).to.equal(2000);
        expect(await settings.nodeMinOnlineDuration()).to.equal(21600);
        expect(await settings.nodeVerifyDuration()).to.equal(1800);
        expect(await settings.nodeSlashReward()).to.equal(E18(10));
        expect(await settings.minTeeStakeAmount()).to.equal(E18(1e5));
        expect(await settings.teeSlashAmount()).to.equal(E18(100));
        expect(await settings.teeUnstakeDuration()).to.equal(21600);
        expect(await settings.nodeMaxMissVerifyCount()).to.equal(5);
        expect(await settings.commissionRate()).to.equal(100);
        expect(await settings.maxNodeWeights()).to.equal(100);
    });

});