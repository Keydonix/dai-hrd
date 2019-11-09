const BN = require('bn.js')

const Dai = artifacts.require('Dai')
const DaiHrd = artifacts.require('DaiHrd')

const MAX_APPROVAL = bigintToHexString(2n**256n-1n)
const DUST = 1n * 10n**18n; // Race with balanceOf and deposit

contract('DaiHrd', ([alice, bob]) => {
	it('balance starts at 0', async () => {
		const daiHrd = await DaiHrd.deployed()
		const aliceBalance = bnToBigInt(await daiHrd.balanceOf(alice))
		const bobBalance = bnToBigInt(await daiHrd.balanceOf(bob))

		expect(aliceBalance).to.equal(0n)
		expect(bobBalance).to.equal(0n)
	})

	it('can deposit dai', async () => {
		const daiHrd = await DaiHrd.deployed()
		const dai = await Dai.at(await daiHrd.dai())

		await dai.approve(daiHrd.address, MAX_APPROVAL)
		await daiHrd.deposit(await dai.balanceOf(alice))

		expect(bnToBigInt(await daiHrd.balanceOf(alice)) > (80n * 10n**18n - DUST) ).to.be.true
		expect(bnToBigInt(await dai.balanceOf(alice)) < DUST ).to.be.true
	})

	it('can deposit dai and withdraw daiHrd', async () => {
		const daiHrd = await DaiHrd.deployed()
		const dai = await Dai.at(await daiHrd.dai())

		await dai.approve(daiHrd.address, MAX_APPROVAL)
		await daiHrd.deposit(await dai.balanceOf(alice))
		await daiHrd.withdraw(await daiHrd.balanceOf(alice))

		expect(bnToBigInt(await dai.balanceOf(alice))).to.equal(80n * 10n**18n)
		expect(bnToBigInt(await daiHrd.balanceOf(alice))).to.equal(0n)
	})
})

function bnToBigInt(input) {
	return BigInt(input.toString())
}

function bigintToHexString(input) {
	return `0x${input.toString(16)}`
}
