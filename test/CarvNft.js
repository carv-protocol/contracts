const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { E, E18, deployAll} = require("./Common")

describe("CarvNft", function () {
    let carv, veCarv, nft, vault, setting, vrf, proxy, proxyAdmin, service, coordinator, signers

    beforeEach(async function () {
        [carv, veCarv, nft, vault, setting, vrf, proxy, proxyAdmin, service, coordinator, signers] = await deployAll()
    })

    it("mint/redeem", async function () {
        vault.nftDeposit(5, {value: E(4, 18)})
        carv.transfer(vault.address, E18(600000))

        await expect(nft.mint()).not.to.be.reverted;
        expect(await nft.balanceOf(signers[0].address)).to.equal(1);
        expect(await nft.ownerOf(1)).to.equal(signers[0].address);

        await expect(nft.redeem(1, false)).to.be.reverted;
        const daysLater180 = 180 * 24 * 60 * 60;
        await time.increase(daysLater180);
        await expect(nft.redeem(1, false)).not.to.be.reverted;
    });

    it("claim", async function () {

        vault.nftDeposit(5, {value: E(4, 18)})
        carv.transfer(vault.address, E18(600000))

        const daysLater180 = 180 * 24 * 60 * 60;
        await expect(nft.mint()).not.to.be.reverted;
        await time.increase(daysLater180);
        await expect(nft.redeem(1, true)).not.to.be.reverted;
        const daysLater10 = 10 * 24 * 60 * 60;

        await expect(nft.claim(1)).not.to.be.reverted;
        // console.log(await nft.claimInfos(1))

        await time.increase(daysLater10);
        await expect(nft.claim(1)).not.to.be.reverted;
        // console.log(await nft.claimInfos(1))

        await time.increase(daysLater10);
        await expect(nft.claim(1)).not.to.be.reverted;
        // console.log(await nft.claimInfos(1))
    });

});