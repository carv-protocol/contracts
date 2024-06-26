const { expect } = require("chai");
const { E, E18, deploySettings} = require("./Common")

describe("Settings", function () {
    it("Update", async function () {
        const { settings, owner } = await deploySettings();

        await expect(await settings.updateSettings({
            maxVrfActiveNodes: 2000,
            nodeMinOnlineDuration: 21600, // 6 hours
            nodeVerifyDuration: 1800,  // 30 minutes
            nodeSlashReward: E18(10) ,  // 10 veCARV
            minTeeStakeAmount: E18(1e5),  // 10,000 CARV
            teeSlashAmount: E18(100),      // 100 veCARV
            teeUnstakeDuration: 21600,   // 6 hours
            minCommissionRateModifyInterval: 604800, // 1 week
            nodeMaxMissVerifyCount: 5,
            maxCommissionRate: 10000,
            maxNodeWeights: 100,
        })).not.to.be.reverted;

        expect(await settings.maxVrfActiveNodes()).to.equal(2000);
        expect(await settings.nodeMinOnlineDuration()).to.equal(21600);
        expect(await settings.nodeVerifyDuration()).to.equal(1800);
        expect(await settings.nodeSlashReward()).to.equal(E18(10));
        expect(await settings.minTeeStakeAmount()).to.equal(E18(1e5));
        expect(await settings.teeSlashAmount()).to.equal(E18(100));
        expect(await settings.teeUnstakeDuration()).to.equal(21600);
        expect(await settings.minCommissionRateModifyInterval()).to.equal(604800);
        expect(await settings.nodeMaxMissVerifyCount()).to.equal(5);
        expect(await settings.maxCommissionRate()).to.equal(10000);
        expect(await settings.maxNodeWeights()).to.equal(100);
    });

});