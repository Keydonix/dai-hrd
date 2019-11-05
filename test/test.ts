const DaiHrd = artifacts.require('DaiHrd')

contract('DaiHrd', ([alice, bob]) => {
	it('balance starts at 0', async () => {
		const daiHrd = await DaiHrd.new()
		const aliceBalance = bnToBigInt(await daiHrd.balanceOf(alice))
		const bobBalance = bnToBigInt(await daiHrd.balanceOf(bob))

		expect(aliceBalance).to.equal(0n)
		expect(bobBalance).to.equal(0n)
	})
})

function bnToBigInt(input) {
	return BigInt(input.toString())
}
