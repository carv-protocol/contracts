const { time } = require("@nomicfoundation/hardhat-network-helpers");
const hre = require("hardhat");
const { expect } = require("chai");
const { E, E18, deployToken2} = require("./Common")

describe("veCarvs", function () {
    let carv, veCarvs, owner, alice, bob;

    async function increaseToEpochBegin() {
        let now = await time.latest()
        let epochDuration = await veCarvs.DURATION_PER_EPOCH()
        let delta = epochDuration - now % epochDuration
        await time.increase(delta);
    }

    async function getReward(signer, pid) {
        let before = await carv.balanceOf(signer.address)
        await veCarvs.connect(signer).claim(pid)
        let after = await carv.balanceOf(signer.address)
        return after.sub(before)
    }

    beforeEach(async function () {
        [carv, veCarvs, owner, alice, bob] = await deployToken2();

        await carv.approve(veCarvs.address, E18(100000000))
        await veCarvs.depositRewardToken(E18(1000000))
    })

    it("proxy", async function () {
        await expect(veCarvs.initialize("veCARV(s)", "veCARV(s)", carv.address)).to.be.reverted;

        const ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
        const veCarvTokens = await hre.ethers.getContractFactory("veCarvs");

        let adminAddr = await hre.upgrades.erc1967.getAdminAddress(veCarvs.address)
        let proxyAdmin = await ProxyAdmin.attach(adminAddr)
        let newImpl = await veCarvTokens.deploy();

        await expect(proxyAdmin.upgradeAndCall(veCarvs.address, newImpl.address, hre.ethers.utils.toUtf8Bytes(""))).not.to.be.reverted;
    });

    it("settings", async function () {

        expect(await veCarvs.rewardPerSecond()).to.equal(E(1, 16));
        expect(await veCarvs.minStakingAmount()).to.equal(E18(10));
        expect(await veCarvs.admin()).to.equal(owner.address);

        expect( (await veCarvs.supportedDurations(30)).active ).to.equal(true);
        expect( (await veCarvs.supportedDurations(30)).rewardWeight ).to.equal(2500);
        expect( (await veCarvs.supportedDurations(30)).stakingMultiplier ).to.equal(2500);

        expect( (await veCarvs.supportedDurations(180)).active ).to.equal(true);
        expect( (await veCarvs.supportedDurations(180)).rewardWeight ).to.equal(15000);
        expect( (await veCarvs.supportedDurations(180)).stakingMultiplier ).to.equal(15000);

        expect( (await veCarvs.supportedDurations(1080)).active ).to.equal(true);
        expect( (await veCarvs.supportedDurations(1080)).rewardWeight ).to.equal(90000);
        expect( (await veCarvs.supportedDurations(1080)).stakingMultiplier ).to.equal(90000);

        expect( (await veCarvs.supportedDurations(0)).active ).to.equal(false);
        expect( (await veCarvs.supportedDurations(0)).rewardWeight ).to.equal(0);
        expect( (await veCarvs.supportedDurations(0)).stakingMultiplier ).to.equal(0);

        expect( (await veCarvs.supportedDurations(120)).active ).to.equal(false);
        expect( (await veCarvs.supportedDurations(120)).rewardWeight ).to.equal(0);
        expect( (await veCarvs.supportedDurations(120)).stakingMultiplier ).to.equal(0);

        await expect(veCarvs.connect(alice).updateSettings({
            rewardPerSecond: E(1, 15),
            minStakingAmount: E18(100),
        })).to.be.reverted;
        await expect(veCarvs.connect(alice).modifySupportedDurations(30, false, 0, 0)).to.be.reverted;
        await expect(veCarvs.connect(alice).modifyAdmin(alice.address)).to.be.reverted;
        await expect(veCarvs.modifyAdmin(alice.address)).not.to.be.reverted;

        expect(await veCarvs.admin()).to.equal(alice.address);

        await expect(veCarvs.connect(alice).updateSettings({
            rewardPerSecond: E(1, 15),
            minStakingAmount: E18(100),
            rewardFactor: 90,
            stakingFactor: 150,
        })).not.to.be.reverted;
        await expect(veCarvs.connect(alice).modifySupportedDurations(30, false, 0, 0)).not.to.be.reverted;
        await expect(veCarvs.connect(alice).modifySupportedDurations(120, true, 10000, 15000)).not.to.be.reverted;

        expect(await veCarvs.rewardPerSecond()).to.equal(E(1, 15));
        expect(await veCarvs.minStakingAmount()).to.equal(E18(100));

        expect( (await veCarvs.supportedDurations(30)).active ).to.equal(false);
        expect( (await veCarvs.supportedDurations(30)).rewardWeight ).to.equal(0);
        expect( (await veCarvs.supportedDurations(30)).stakingMultiplier ).to.equal(0);

        expect( (await veCarvs.supportedDurations(1080)).active ).to.equal(true);
        expect( (await veCarvs.supportedDurations(1080)).rewardWeight ).to.equal(90000);
        expect( (await veCarvs.supportedDurations(1080)).stakingMultiplier ).to.equal(90000);

        expect( (await veCarvs.supportedDurations(120)).active ).to.equal(true);
        expect( (await veCarvs.supportedDurations(120)).rewardWeight ).to.equal(10000);
        expect( (await veCarvs.supportedDurations(120)).stakingMultiplier ).to.equal(15000);
    });

    it("deposit-1", async function () {
        await expect(veCarvs.deposit(E18(9), 3600*24*30)).to.be.reverted;
        await expect(veCarvs.deposit(E18(10), 3600*24*30)).not.to.be.reverted;
        await expect(veCarvs.deposit(E18(1000), 3600*24*30)).not.to.be.reverted;

        await expect(veCarvs.deposit(E18(1000), 0)).to.be.reverted;
        await expect(veCarvs.deposit(E18(1000), 3600*24*50)).to.be.reverted;
        await expect(veCarvs.deposit(E18(1000), 3600*24*30+1)).to.be.reverted;
        await expect(veCarvs.deposit(E18(1000), 3600*24*30)).not.to.be.reverted;

        await expect(veCarvs.connect(alice).deposit(E18(1000), 3600*24*30)).to.be.reverted;
        await carv.transfer(alice.address, E18(1000))
        await carv.connect(alice).approve(veCarvs.address, E18(1000))
        await expect(veCarvs.connect(alice).deposit(E18(1000), 3600*24*30)).not.to.be.reverted;
    });

    it("deposit-2", async function () {
        await increaseToEpochBegin()
        await expect(veCarvs.deposit(E18(1000), 3600*24*30)).not.to.be.reverted;
        expect(await veCarvs.balanceOfAt(owner.address, await time.latest() - 1)).to.equal(E18(250));
        expect(await veCarvs.totalSupplyAt(await time.latest() - 1)).to.equal(E18(250));
        expect( (await veCarvs.positions(1)).user ).to.equal(owner.address);
        expect( (await veCarvs.positions(1)).balance ).to.equal(E18(1000));
        expect( (await veCarvs.positions(1)).end ).to.equal((await time.latest() - 1 + 3600*24*30));

        await time.increase(3600*24*50)

        await increaseToEpochBegin()
        await expect(veCarvs.deposit(E18(100), 3600*24*360)).not.to.be.reverted;
        expect(await veCarvs.balanceOfAt(owner.address, await time.latest() - 1)).to.equal(E18(300));
        expect(await veCarvs.totalSupplyAt(await time.latest() - 1)).to.equal(E18(300));
        expect( (await veCarvs.positions(2)).user ).to.equal(owner.address);
        expect( (await veCarvs.positions(2)).balance ).to.equal(E18(100));
        expect( (await veCarvs.positions(2)).end ).to.equal((await time.latest() - 1 + 3600*24*360));
    });

    it("claim-1", async function () {
        await increaseToEpochBegin()

        await expect(veCarvs.deposit(E18(1000), 3600*24*90)).not.to.be.reverted;

        expect(await veCarvs.accumulatedRewardPerShare()).to.equal(E18(0));
        expect(await veCarvs.totalShare()).to.equal(E18(1000).mul(90).div(120));
        expect(await veCarvs.lastRewardTimestamp()).to.equal(await time.latest());
        expect(await veCarvs.rewardTokenAmount()).to.equal(E18(1000000));
        expect( (await veCarvs.positions(1)).share ).to.equal(E18(1000).mul(90).div(120));
        expect( (await veCarvs.positions(1)).debt ).to.equal(E18(0));

        time.increase(3600*24)
        await expect(veCarvs.claim(1)).not.to.be.reverted;

        expect(await veCarvs.totalShare()).to.equal(E18(1000).mul(90).div(120));
        expect(await veCarvs.rewardTokenAmount()).to.equal(E18(1000000).sub(E18(36*24)));
        expect( (await veCarvs.positions(1)).share ).to.equal(E18(1000).mul(90).div(120));
        expect( (await veCarvs.positions(1)).debt ).to.equal((await veCarvs.positions(1)).share.mul(await veCarvs.accumulatedRewardPerShare()).div(E18(1)));

        time.increase(3600*24*10)
        await expect(veCarvs.claim(1)).not.to.be.reverted;
        expect(await veCarvs.totalShare()).to.equal(E18(1000).mul(90).div(120));
        // expect(await veCarvs.rewardTokenAmount()).to.equal(E18(1000000).sub(E18(36*24*11)));
        expect( (await veCarvs.positions(1)).share ).to.equal(E18(1000).mul(90).div(120));
        expect( (await veCarvs.positions(1)).debt ).to.equal((await veCarvs.positions(1)).share.mul(await veCarvs.accumulatedRewardPerShare()).div(E18(1)));

    });

    it("claim-2", async function () {
        await carv.transfer(alice.address, E18(1000))
        await carv.connect(alice).approve(veCarvs.address, E18(1000))
        await carv.transfer(bob.address, E18(1000))
        await carv.connect(bob).approve(veCarvs.address, E18(1000))

        await increaseToEpochBegin()

        await expect(veCarvs.deposit(E18(100), 3600*24*90)).not.to.be.reverted;
        time.increase(3600*24)

        await expect(veCarvs.connect(alice).deposit(E18(100), 3600*24*90)).not.to.be.reverted;
        time.increase(3600*24)

        let reward1 = await getReward(owner, 1)
        let reward2 = await getReward(alice, 2)

        console.log(reward1)
        console.log(reward2)

        await expect(veCarvs.connect(bob).deposit(E18(200), 3600*24*90)).not.to.be.reverted;
        time.increase(3600*24)

        let reward3 = await getReward(owner, 1)
        let reward4 = await getReward(alice, 2)
        let reward5 = await getReward(bob, 3)

        console.log(reward3)
        console.log(reward4)
        console.log(reward5)
    });

    it("withdraw", async function () {
        await veCarvs.deposit(E18(1000), 3600*24*30);

        await expect(veCarvs.withdraw(1)).to.be.reverted;
        await time.increase(30 * 24 * 3600);
        await expect(veCarvs.withdraw(1)).not.to.be.reverted;
        await expect(veCarvs.withdraw(1)).to.be.reverted;

        expect(await veCarvs.balanceOf(owner.address)).to.equal(0);
        expect(await veCarvs.totalSupply()).to.equal(0);
        expect( (await veCarvs.positions(1)).balance ).to.equal(0);


        await veCarvs.deposit(E18(1000), 3600*24*30);
        await time.increase(30 * 24 * 3600);

        let before = await carv.balanceOf(owner.address)
        await expect(veCarvs.withdraw(2)).not.to.be.reverted;
        let after = await carv.balanceOf(owner.address)

        expect(after.sub(before)).to.above(E18(1000));
    });

    // it("balance", async function () {
    //     const day = 24 * 3600;
    //
    //     let now = await time.latest()
    //     let epochDuration = await veCarvs.DURATION_PER_EPOCH()
    //     let delta = epochDuration - now % epochDuration
    //     await time.increase(delta);
    //
    //     await veCarvs.deposit(E18(10), day * 30);
    //     console.log(await veCarvs.balanceOfAt(owner.address, await time.latest() - 1))
    //
    //     await time.increase(day-1);
    //     console.log(await veCarvs.balanceOf(owner.address))
    //     await time.increase(day*4);
    //     console.log(await veCarvs.balanceOf(owner.address))
    //
    //     await veCarvs.deposit(E18(10), day * 30);
    //     console.log(await veCarvs.balanceOfAt(owner.address, (await time.latest()) - 1))
    //
    //     await time.increase(day-1);
    //     console.log(await veCarvs.balanceOf(owner.address))
    //
    //     await time.increase(day*4);
    //     console.log(await veCarvs.balanceOf(owner.address))
    //
    //     await time.increase(day);
    //     console.log(await veCarvs.balanceOf(owner.address))
    //
    //     await time.increase(day);
    //     console.log(await veCarvs.balanceOf(owner.address))
    //
    //     await time.increase(day);
    //     console.log(await veCarvs.balanceOf(owner.address))
    //
    //     await time.increase(day);
    //     console.log(await veCarvs.balanceOf(owner.address))
    //
    //     await time.increase(day);
    //     console.log(await veCarvs.balanceOf(owner.address))
    //
    //     await time.increase(day);
    //     console.log(await veCarvs.balanceOf(owner.address))
    //
    // });
    //
    // it("totalSupply", async function () {
    //     await carv.transfer(alice.address, E18(100))
    //     await carv.approve(veCarvs.address, E18(100))
    //     await carv.connect(alice).approve(veCarvs.address, E18(100))
    //
    //     const day = 24 * 3600;
    //
    //     let now = await time.latest()
    //     let epochDuration = await veCarvs.DURATION_PER_EPOCH()
    //     let delta = epochDuration - now % epochDuration
    //     await time.increase(delta);
    //
    //     await veCarvs.deposit(E18(10), day * 30);
    //     console.log(await veCarvs.totalSupplyAt(await time.latest() - 1))
    //
    //     await time.increase(day-1);
    //     console.log(await veCarvs.totalSupply())
    //     await time.increase(day*4);
    //     console.log(await veCarvs.totalSupply())
    //
    //     await veCarvs.connect(alice).deposit(E18(10), day * 30);
    //     console.log(await veCarvs.totalSupplyAt(await time.latest() - 1))
    //
    //     await time.increase(day-1);
    //     console.log(await veCarvs.totalSupply())
    //
    //     await time.increase(day*4);
    //     console.log(await veCarvs.totalSupply())
    //
    //     await time.increase(day);
    //     console.log(await veCarvs.totalSupply())
    //
    //     await time.increase(day);
    //     console.log(await veCarvs.totalSupply())
    //
    //     await time.increase(day);
    //     console.log(await veCarvs.totalSupply())
    //
    //     await time.increase(day);
    //     console.log(await veCarvs.totalSupply())
    //
    //     await time.increase(day);
    //     console.log(await veCarvs.totalSupply())
    //
    //     await time.increase(day);
    //     console.log(await veCarvs.totalSupply())
    //
    // });

});