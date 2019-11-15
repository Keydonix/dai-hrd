import { Crypto } from '@peculiar/webcrypto'
import Jasmine = require('jasmine');
const jasmine = new Jasmine({})
;(jasmine.jasmine as any).getEnv().configure({ failFast: true, random: false, oneFailurePerSpec: true })

// necessary so node crypto looks like web crypto, which @zoltu/ethereum-crypto needs
globalThis.crypto = new Crypto()

import { encodeMethod } from '@zoltu/ethereum-abi-encoder';
import { keccak256 } from '@zoltu/ethereum-crypto';
import { testDeploy, getGanacheControls, GanacheControls, startGanacheIfNecessary, triggerInstasealBlock } from './helpers';
import { MnemonicSigner } from '../scripts/libraries/mnemonic-signer';
import { xToRontox, daiToAttodai } from '../scripts/libraries/type-helpers';
import { Actor, duplicateActor } from '../scripts/libraries/actor';
import { TestDependencies } from './test-dependencies';
import { generateDai } from '../scripts/seed/seed-maker';
import { resetMaker } from '../scripts/seed/reset-maker';

const MAX_APPROVAL = 2n**256n-1n

describe('DaiHrd', () => {
	let ganache: GanacheControls
	let alice: Actor
	let bob: Actor
	let carol: Actor

	beforeAll(async () => {
		const signer = await MnemonicSigner.createTest(0)
		const port = await startGanacheIfNecessary(signer)

		alice = await testDeploy(`http://localhost:${port}`, signer)
		bob = await duplicateActor(alice, await MnemonicSigner.createTest(1), TestDependencies)
		carol = await duplicateActor(alice, await MnemonicSigner.createTest(2), TestDependencies)

		ganache = getGanacheControls(alice.rpc)

		await resetMaker(alice)

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

	it('can set DSR', async () => {
		await alice.setDsr.setDsr(xToRontox(1n))
		expect(await alice.pot.dsr_()).toEqual(10n**27n)
		const newDsr = xToRontox(1.000001);
		await alice.setDsr.setDsr(newDsr)
		expect(await alice.pot.dsr_()).toEqual(newDsr)
	})

	it('can set DSR, deposit, and withdraw', async () => {
		const DSR_RATE = 1.000001

		const attodaiToDeposit = daiToAttodai(10_000n)
		await generateDai(alice, attodaiToDeposit)

		await triggerInstasealBlock(alice)
		const newDsr = xToRontox(DSR_RATE)
		await alice.setDsr.setDsr(newDsr)

		await alice.dai.approve(alice.daiHrd.address, MAX_APPROVAL)
		const chiBeforeDeposit = await alice.daiHrd.calculatedChi_()
		await ganache.advanceTime(2)

		await alice.daiHrd.deposit(attodaiToDeposit)
		await ganache.advanceTime(2)

		await triggerInstasealBlock(alice)
		const chiAfterDeposit = await alice.daiHrd.calculatedChi_()
		await ganache.advanceTime(14)
		await alice.daiHrd.withdrawTo(alice.address, await alice.daiHrd.balanceOf_(alice.address))
		await triggerInstasealBlock(alice)
		const chiAfterWithdraw = await alice.daiHrd.calculatedChi_()

		const lowerBoundChiDelta = chiAfterWithdraw - chiAfterDeposit
		const upperBoundChiDelta = chiAfterWithdraw - chiBeforeDeposit

		const lowerBalanceAttodai = attodaiToDeposit + lowerBoundChiDelta * attodaiToDeposit / 10n**27n
		const upperBalanceAttodai = attodaiToDeposit + upperBoundChiDelta * attodaiToDeposit / 10n**27n

		const newBalanceAttodai = await alice.dai.balanceOf_(alice.address)

		expect(newBalanceAttodai >= lowerBalanceAttodai).toBeTruthy('Not enough DAI paid from DSR')
		expect(newBalanceAttodai <= upperBalanceAttodai).toBeTruthy('Too much DAI paid from DSR')
		expect(await alice.daiHrd.balanceOf_(alice.address)).toEqual(0n)
	})

	it('can set DSR, deposit, and withdraw denominated in DAI', async () => {
		const DSR_RATE = 1.000001

		const attodaiToDeposit = daiToAttodai(10_000n)
		await generateDai(alice, attodaiToDeposit)

		const newDsr = xToRontox(DSR_RATE)
		await triggerInstasealBlock(alice)
		await alice.setDsr.setDsr(newDsr)

		await alice.dai.approve(alice.daiHrd.address, MAX_APPROVAL)
		const chiBeforeDeposit = await alice.daiHrd.calculatedChi_()
		await ganache.advanceTime(2)

		await alice.daiHrd.deposit(attodaiToDeposit)
		const attodaiHrdMinted = await alice.daiHrd.balanceOf_(alice.address);
		await ganache.advanceTime(2)

		await triggerInstasealBlock(alice)
		const chiAfterDeposit = await alice.daiHrd.calculatedChi_()
		await ganache.advanceTime(14)
		await alice.daiHrd.withdrawToDenominatedInDai(alice.address, attodaiToDeposit)
		await triggerInstasealBlock(alice)
		const chiAfterWithdraw = await alice.daiHrd.calculatedChi_()

		const lowerBoundChiDelta = chiAfterWithdraw - chiAfterDeposit
		const upperBoundChiDelta = chiAfterWithdraw - chiBeforeDeposit

		const lowerBalanceAttodaiHrd = lowerBoundChiDelta * attodaiHrdMinted / 10n**27n
		const upperBalanceAttodaiHrd = upperBoundChiDelta * attodaiHrdMinted / 10n**27n

		const newBalanceAttodaiHrd = await alice.daiHrd.balanceOf_(alice.address)

		expect(newBalanceAttodaiHrd >= lowerBalanceAttodaiHrd).toBeTruthy('Not enough DAI-HRD left over from DSR')
		expect(newBalanceAttodaiHrd <= upperBalanceAttodaiHrd).toBeTruthy('Too much DAI-HRD left over from DSR')
		expect(await alice.dai.balanceOf_(alice.address)).toEqual(attodaiToDeposit)
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
		const attodaiToDeposit = daiToAttodai(10_000n)
		await generateDai(alice, attodaiToDeposit)

		await alice.dai.approve(alice.daiHrd.address, MAX_APPROVAL)
		await alice.daiHrd.deposit(attodaiToDeposit)

		expect(await alice.daiHrd.balanceOf_(alice.address)).toEqual(attodaiToDeposit)
		expect(await alice.dai.balanceOf_(alice.address)).toEqual(0n)
	})

	it('can deposit and withdraw dai', async () => {
		const attodaiToDeposit = daiToAttodai(10_000n)
		await generateDai(alice, attodaiToDeposit)

		await alice.dai.approve(alice.daiHrd.address, MAX_APPROVAL)
		await alice.daiHrd.deposit(attodaiToDeposit)
		await alice.daiHrd.withdrawTo(alice.address, attodaiToDeposit)

		expect(await alice.dai.balanceOf_(alice.address)).toEqual(attodaiToDeposit)
		expect(await alice.daiHrd.balanceOf_(alice.address)).toEqual(0n)
	})

	it('can deposit dai and withdraw daiHrd denominated in dai', async () => {
		const attodaiToDeposit = daiToAttodai(10_000n)
		await generateDai(alice, attodaiToDeposit)

		await alice.dai.approve(alice.daiHrd.address, MAX_APPROVAL)
		await alice.daiHrd.deposit(attodaiToDeposit)
		await alice.daiHrd.withdrawToDenominatedInDai(alice.address, await alice.daiHrd.balanceOfDenominatedInDai_(alice.address))

		expect(await alice.dai.balanceOf_(alice.address)).toEqual(attodaiToDeposit)
		expect(await alice.daiHrd.balanceOf_(alice.address)).toEqual(0n)
	})

	it('can withdraw vat dai', async () => {
		const attodaiToDeposit = daiToAttodai(10_000n)
		await generateDai(alice, attodaiToDeposit)

		await alice.dai.approve(alice.daiHrd.address, MAX_APPROVAL)
		await alice.daiHrd.deposit(attodaiToDeposit)
		await alice.daiHrd.withdrawVatDai(alice.address, attodaiToDeposit)

		expect(await alice.dai.balanceOf_(alice.address)).toEqual(0n)
		expect(await alice.daiHrd.balanceOf_(alice.address)).toEqual(0n)
		expect(await alice.vat.dai_(alice.address)).toEqual(attodaiToDeposit * 10n**27n)
	})

	xit('sandbox', async () => {
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
