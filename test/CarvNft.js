const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarvNft", function () {

    function E(x, d) {
        return ethers.BigNumber.from("10").pow(d).mul(x)
    }

    function E18(x) {
        return ethers.BigNumber.from("1000000000000000000").mul(x)
    }

    function contractAddr(deployer, nonce) {
        return ethers.utils.getContractAddress({
            from: deployer,
            nonce: nonce,
        });
    }

    let carv, veCarv, nft, vault, service, owner, alice, bob

    beforeEach(async function () {
        [owner, alice, bob] = await ethers.getSigners();

        const CarvToken = await ethers.getContractFactory("CarvToken");
        const veCarvToken = await ethers.getContractFactory("veCarvToken");
        const CarvNft = await ethers.getContractFactory("CarvNft");
        const Vault = await ethers.getContractFactory("Vault");
        const ProtocolService = await ethers.getContractFactory("ProtocolService");
        const MockAggregator = await ethers.getContractFactory("Aggregator");

        const nftAddr = contractAddr(owner.address, (await owner.getTransactionCount()) + 2)
        const vaultAddr = contractAddr(owner.address, (await owner.getTransactionCount()) + 3)
        const serviceAddr = contractAddr(owner.address, (await owner.getTransactionCount()) + 4)

        carv = await CarvToken.deploy(owner.address);
        veCarv = await veCarvToken.deploy(carv.address, vaultAddr);
        nft = await CarvNft.deploy(carv.address, vaultAddr, serviceAddr);
        vault = await Vault.deploy(carv.address, veCarv.address);
        service = await ProtocolService.deploy(carv.address, nftAddr, vaultAddr, owner.address);
        const aggregator = await MockAggregator.deploy();

        await vault.initialize(owner.address, nftAddr, serviceAddr)
        await service.initialize()

        await vault.updateAggregatorAddress(aggregator.address);
    })

    it("mint/redeem", async function () {
        vault.nftDeposit(5, {value: E(4, 18)})
        carv.transfer(vault.address, E18(600000))

        await expect(nft.mint()).not.to.be.reverted;
        expect(await nft.balanceOf(owner.address)).to.equal(1);
        expect(await nft.ownerOf(1)).to.equal(owner.address);

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