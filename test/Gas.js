const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Gas", function () {
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

    let carv, veCarv, nft, vault, setting, service, owner, alice, bob, coordinator

    beforeEach(async function () {
        [owner, alice, bob] = await ethers.getSigners();

        const CarvToken = await ethers.getContractFactory("CarvToken");
        const veCarvToken = await ethers.getContractFactory("veCarvToken");
        const CarvNft = await ethers.getContractFactory("CarvNft");
        const Vault = await ethers.getContractFactory("Vault");
        const Settings = await ethers.getContractFactory("Settings");
        const ProtocolService = await ethers.getContractFactory("ProtocolService");
        const MockAggregator = await ethers.getContractFactory("Aggregator");
        const MockVRFCoordinator = await ethers.getContractFactory("VRFCoordinator");

        const nftAddr = contractAddr(owner.address, (await owner.getTransactionCount()) + 4)
        const vaultAddr = contractAddr(owner.address, (await owner.getTransactionCount()) + 5)
        const settingAddr = contractAddr(owner.address, (await owner.getTransactionCount()) + 6)
        const serviceAddr = contractAddr(owner.address, (await owner.getTransactionCount()) + 7)

        const aggregator = await MockAggregator.deploy();
        coordinator = await MockVRFCoordinator.deploy();

        carv = await CarvToken.deploy(owner.address);
        veCarv = await veCarvToken.deploy(carv.address, vaultAddr);
        nft = await CarvNft.deploy(carv.address, vaultAddr, serviceAddr);
        vault = await Vault.deploy(carv.address, veCarv.address);
        setting = await Settings.deploy();
        service = await ProtocolService.deploy(carv.address, nftAddr, vaultAddr, coordinator.address);

        await vault.initialize(owner.address, nftAddr, serviceAddr)
        await setting.updateSettings({
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
        })
        await service.initialize()

        await vault.updateAggregatorAddress(aggregator.address);
        await service.updateVrfConfig({
            keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
            subId: 100,
            requestConfirmations: 3,
            callbackGasLimit: 10000,
            nativePayment: true
        })
        await service.updateSettings(settingAddr)
    })

    // it("Tee", async function () {
    //     await carv.transfer(alice.address, E18(10000000))
    //     await expect(service.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEE_ROLE")), alice.address)).not.to.be.reverted;
    //
    //     await carv.connect(alice).approve(service.address, E18(1000000))
    //     await expect(service.connect(alice).teeStake(E18(1000000))).not.to.be.reverted;
    //     await expect(service.connect(alice).teeReportAttestation("test0")).not.to.be.reverted;
    //     await coordinator.callback(1, [123456789])
    //
    //     await expect(service.connect(alice).teeReportAttestationBatch(["test1", "test2", "test3", "test4"])).not.to.be.reverted;
    //     await coordinator.callback(2, [123456789])
    // });

    async function runNode(signer) {
        await nft.connect(signer).mint();
        await service.connect(signer).delegate(await nft.tokenIndex(), signer.address)
        await service.connect(signer).nodeEnter(signer.address)
    }

    it("Node", async function () {

        let signers = await ethers.getSigners();
        for (let i=0; i<signers.length; i++)
        {
            console.log(i)
            await runNode(signers[i])
        }

        await carv.transfer(alice.address, E18(10000000))
        await expect(service.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEE_ROLE")), alice.address)).not.to.be.reverted;

        await carv.connect(alice).approve(service.address, E18(1000000))
        await expect(service.connect(alice).teeStake(E18(1000000))).not.to.be.reverted;
        await expect(service.connect(alice).teeReportAttestation("test0")).not.to.be.reverted;
        await coordinator.callback(1, [123456789])

        await expect(service.connect(alice).teeReportAttestationBatch(["tess1"])).not.to.be.reverted;
        await coordinator.callback(2, [123456789])

        await expect(service.connect(alice).teeReportAttestationBatch(["test1", "test2", "test3", "test4"])).not.to.be.reverted;
        await coordinator.callback(3, [123456789])
        //
        // await expect(service.connect(alice).teeReportAttestationBatch(
        //     ["test5", "test6", "test7", "test8", "test9", "test10", "test11", "test12", "test13", "test14", "test15", "test16"]
        // )).not.to.be.reverted;
        // await coordinator.callback(4, [123456789])

    });
    //
    // it("Report", async function () {
    //
    //     await nft.connect(alice).mint();
    //     await expect(service.connect(alice).delegate(1, alice.address)).not.to.be.reverted;
    //     await expect(service.connect(alice).nodeEnter(alice.address)).not.to.be.reverted;
    //
    //     await expect(service.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEE_ROLE")), owner.address)).not.to.be.reverted;
    //     await carv.approve(service.address, E18(1000000))
    //     await expect(service.teeStake(E18(1000000))).not.to.be.reverted;
    //     await expect(service.teeReportAttestation("test")).not.to.be.reverted;
    //     await coordinator.callback(1, [123456789])
    //
    //     await service.connect(alice).nodeReportVerification(
    //         ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test")),
    //         0,
    //         0
    //     )
    //
    //     // console.log(await service.attestations(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"))))
    //     // console.log(await service.nodeInfos(alice.address))
    // });

});