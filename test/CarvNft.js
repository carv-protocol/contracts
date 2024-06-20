const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { E, E18, deployNft} = require("./Common")

describe("CarvNft", function () {
    let owner, alice, bob, cindy, nft

    beforeEach(async function () {
        [owner, alice, bob, cindy, nft] = await deployNft()
    })

    it("mint", async function () {

        const meta = {
            code: "gg",
            price: 123456,
            tier: 5
        }

        await expect(nft.connect(alice).mint(alice.address, 1, meta)).to.be.reverted
        await expect(nft.mint(alice.address, 1, meta)).not.to.be.reverted
        expect(await nft.balanceOf(alice.address)).to.equal(1);
        expect(await nft.ownerOf(1)).to.equal(alice.address);

        await expect(nft.connect(bob).mint(bob.address, 10, meta)).to.be.reverted
        await expect(nft.mint(bob.address, 10, meta)).not.to.be.reverted
        expect(await nft.balanceOf(bob.address)).to.equal(10);
        expect(await nft.ownerOf(2)).to.equal(bob.address);
        expect(await nft.ownerOf(3)).to.equal(bob.address);
        expect(await nft.ownerOf(10)).to.equal(bob.address);
        expect(await nft.ownerOf(11)).to.equal(bob.address);

        await expect(nft.mint(cindy.address, 100000, meta)).to.be.reverted
    });

    it("mintBatch", async function () {
        const meta = {
            code: "gg",
            price: 123456,
            tier: 5
        }

        await expect(nft.connect(alice).mintBatch(
            [alice.address, bob.address, cindy.address], [3, 6, 9], [meta, meta, meta]
        )).to.be.reverted

        await expect(nft.mintBatch(
            [alice.address, bob.address, cindy.address], [3, 6], [meta, meta, meta]
        )).to.be.reverted

        await expect(nft.mintBatch(
            [alice.address, bob.address, cindy.address], [3, 6, 9], [meta, meta]
        )).to.be.reverted

        await expect(nft.mintBatch(
            [alice.address, bob.address, cindy.address],
            [3, 6, 9],
            [meta, meta, meta]
        )).not.to.be.reverted

        expect(await nft.balanceOf(alice.address)).to.equal(3);
        expect(await nft.balanceOf(bob.address)).to.equal(6);
        expect(await nft.balanceOf(cindy.address)).to.equal(9);

        expect(await nft.ownerOf(1)).to.equal(alice.address);
        expect(await nft.ownerOf(3)).to.equal(alice.address);

        expect(await nft.ownerOf(4)).to.equal(bob.address);
        expect(await nft.ownerOf(9)).to.equal(bob.address);

        expect(await nft.ownerOf(10)).to.equal(cindy.address);
        expect(await nft.ownerOf(18)).to.equal(cindy.address);
    });

    it("transfer", async function () {
        const meta = {
            code: "gg",
            price: 123456,
            tier: 5
        }

        let currentTimestamp = await time.latest()
        const daysLater356 = 356 * 24 * 60 * 60;

        await expect(nft.setTransferProhibitedUntil(currentTimestamp+daysLater356)).not.to.be.reverted
        await expect(nft.mint(alice.address, 1, meta)).not.to.be.reverted

        await expect(nft.connect(alice).transferFrom(alice.address, bob.address, 1)).to.be.reverted
        await expect(nft.setTransferOnceWhitelist([alice.address])).not.to.be.reverted
        await expect(nft.connect(alice).transferFrom(alice.address, bob.address, 1)).not.to.be.reverted

        await expect(nft.connect(bob).transferFrom(bob.address, alice.address, 1)).to.be.reverted
        await expect(nft.setTransferOnceWhitelist([bob.address])).not.to.be.reverted
        await expect(nft.connect(bob).transferFrom(bob.address, alice.address, 1)).to.be.reverted

        await expect(nft.connect(bob).transferFrom(bob.address, owner.address, 1)).to.be.reverted
        await expect(nft.setRedeemAddress(owner.address)).not.to.be.reverted
        await expect(nft.connect(bob).transferFrom(bob.address, owner.address, 1)).not.to.be.reverted

        await expect(nft.mint(cindy.address, 1, meta)).not.to.be.reverted
        await expect(nft.connect(cindy).transferFrom(cindy.address, alice.address, 2)).to.be.reverted
        await time.increase(daysLater356);
        await expect(nft.connect(cindy).transferFrom(cindy.address, alice.address, 2)).not.to.be.reverted
    });

    it("tokenURI", async function () {
        const meta = {
            code: "gg",
            price: 123456,
            tier: 5
        }

        let BASE_URI = "test"
        await expect(nft.setBaseURI(BASE_URI)).not.to.be.reverted
        await expect(nft.mint(alice.address, 3, meta)).not.to.be.reverted
        expect(await nft.tokenURI(1)).to.equal(BASE_URI+"1");
        expect(await nft.tokenURI(2)).to.equal(BASE_URI+"2");
        expect(await nft.tokenURI(3)).to.equal(BASE_URI+"3");

        expect((await nft.tokenMetas(1))[0]).to.equal("gg");
        expect((await nft.tokenMetas(1))[1]).to.equal(123456);
        expect((await nft.tokenMetas(1))[2]).to.equal(5);
    });

});