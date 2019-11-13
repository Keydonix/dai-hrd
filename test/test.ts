import Jasmine = require('jasmine');
const jasmine = new Jasmine({})
;(jasmine.jasmine as any).getEnv().configure({ failFast: true, random: false, oneFailurePerSpec: true })

import { encodeMethod } from '@zoltu/ethereum-abi-encoder';
import { keccak256 } from '@zoltu/ethereum-crypto';
import { duplicateActor, Actor, testDeploy, getGanacheControls, GanacheControls, startGanache } from './helpers';
import { MnemonicSigner } from '../scripts/libraries/mnemonic-signer';

const MAX_APPROVAL = 2n**256n-1n

describe('DaiHrd', () => {
	let ganache: GanacheControls
	let alice: Actor
	let bob: Actor
	let carol: Actor

	beforeAll(async () => {
		const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong'
		const port = await startGanache(mnemonic)
		// TODO: create a system for supporting different targets to test against.  For now, uncomment below and comment above if you want to test against external node
		// startGanache
		// const port = 8545
		alice = await testDeploy(`http://localhost:${port}`, mnemonic.split(' '))
		bob = await duplicateActor(alice, await MnemonicSigner.create(mnemonic.split(' '), 1))
		carol = await duplicateActor(alice, await MnemonicSigner.create(mnemonic.split(' '), 2))

		ganache = getGanacheControls(alice.rpc)

		// stop auto-mining so we can have tight control on block timestamps
		// await rpc.remoteProcedureCall({ id: 1, jsonrpc: '2.0', method: 'miner_stop' as unknown as 'eth_chainId' /* lies! */, params: [] })
	}, 60000)

	let snapshotId: bigint | undefined = undefined
	beforeEach(async () => {
		if (snapshotId !== undefined) {
			await ganache.revert(snapshotId)
			snapshotId = undefined
		}
		snapshotId = await ganache.snapshot()
	})

	afterEach(async () => {
		if (snapshotId !== undefined) {
			await ganache.revert(snapshotId)
			snapshotId = undefined
		}
	})

	it('balance starts at 0', async () => {
		const aliceBalance = await alice.daiHrd.balanceOf_(alice.address)
		const bobBalance = await bob.daiHrd.balanceOf_(bob.address)
		const carolBalance = await carol.daiHrd.balanceOf_(carol.address)

		expect(aliceBalance).toEqual(0n)
		expect(bobBalance).toEqual(0n)
		expect(carolBalance).toEqual(0n)
	})

	it('can deposit dai', async () => {
		await alice.dai.approve(alice.daiHrd.address, MAX_APPROVAL)
		const balance = await alice.dai.balanceOf_(alice.address)
		await alice.daiHrd.deposit(balance)

		expect(await alice.daiHrd.balanceOf_(alice.address)).toEqual(80n * 10n**18n)
		expect(await alice.dai.balanceOf_(alice.address)).toEqual(0n)
	})

	it('can deposit and withdraw dai', async () => {
		await alice.dai.approve(alice.daiHrd.address, MAX_APPROVAL)
		await alice.daiHrd.deposit(await alice.dai.balanceOf_(alice.address))
		await alice.daiHrd.withdrawTo(alice.address, await alice.daiHrd.balanceOf_(alice.address))

		expect(await alice.dai.balanceOf_(alice.address)).toEqual(80n * 10n**18n)
		expect(await alice.daiHrd.balanceOf_(alice.address)).toEqual(0n)
	})

	it('can deposit dai and withdraw daiHrd denominated in dai', async () => {
		await alice.dai.approve(alice.daiHrd.address, MAX_APPROVAL)
		await alice.daiHrd.deposit(await alice.dai.balanceOf_(alice.address))
		await alice.daiHrd.withdrawToDenominatedInDai(alice.address, await alice.daiHrd.balanceOfDenominatedInDai_(alice.address))

		expect(await alice.dai.balanceOf_(alice.address)).toEqual(80n * 10n**18n)
		expect(await alice.daiHrd.balanceOf_(alice.address)).toEqual(0n)
	})

	it('can withdraw vat dai', async () => {
		await alice.dai.approve(alice.daiHrd.address, MAX_APPROVAL)
		await alice.daiHrd.deposit(await alice.dai.balanceOf_(alice.address))
		await alice.daiHrd.withdrawVatDai(alice.address, await alice.daiHrd.balanceOf_(alice.address))

		expect(await alice.dai.balanceOf_(alice.address)).toEqual(0n)
		expect(await alice.daiHrd.balanceOf_(alice.address)).toEqual(0n)
		expect(await alice.vat.dai_(alice.address)).toEqual(80n * 10n**18n * 10n**27n)
	})

	xit('estimateGas', async () => {
		await alice.dai.approve(alice.daiHrd.address, MAX_APPROVAL)
		await alice.daiHrd.deposit(await alice.dai.balanceOf_(alice.address))
		const daiHrdBalanceInDai = await alice.daiHrd.balanceOfDenominatedInDai_(alice.address)
		let aggregate = 0n
		let min = 1000000n
		let max = 0n
		for (let i = 0; i < 100; ++i) {
			const result = await alice.rpc.estimateGas({ from: alice.address, to: alice.daiHrd.address, data: await encodeMethod(keccak256.hash, 'withdrawToDenominatedInDai(address,uint256)', [alice.address, daiHrdBalanceInDai]), value: 0n, gasLimit: 1000000n, gasPrice: 1000000000n })
			await ganache.advanceTime(1)
			console.log(result)
			aggregate += result
			min = min < result ? min : result
			max = max > result ? max : result
		}
		console.log(`Min: ${min}\nMax: ${max}\nAverage: ${aggregate/100n}`)
	}, 60000)
})

jasmine.execute()
