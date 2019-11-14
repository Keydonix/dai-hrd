import { Crypto } from '@peculiar/webcrypto'
import { DependenciesImpl } from '../libraries/generated-dependencies'
import { stringLiteralToBigint, xToAttorontox, xToRontox } from '../libraries/type-helpers'
import { createTestActorFromAddresses, Actor } from '../libraries/actor'

export async function resetMaker(actor: Actor) {
	const { signer, ethJoin, vat, daiJoin, dai, daiHrd, pot, setDsr } = actor

	const ethId = await ethJoin.ilk_()

	// approvals
	// authorize daiJoin to modify our vat dai balances
	await vat.hope(daiJoin.address)
	// authorize daiJoin to burn DAI
	await dai.approve(daiJoin.address, 2n**256n - 1n)
	// authorize DaiHrd to transfer VatDAI
	await vat.hope(daiHrd.address)
	// authorize DaiHrd to transfer DAI
	await dai.approve(daiHrd.address, 2n**256n - 1n)

	// set DSR
	const dsr = xToRontox(1n)
	if (await pot.dsr_() !== dsr) await setDsr.setDsr(dsr)

	// set ETH price
	await vat.file(ethId, stringLiteralToBigint('spot'), xToRontox(190n))

	// set ETH debt ceiling
	const attorontodaiDebtCeiling = xToAttorontox(100_000_000n)
	await vat.file2(stringLiteralToBigint('Line'), attorontodaiDebtCeiling)
	await vat.file(ethId, stringLiteralToBigint('line'), attorontodaiDebtCeiling)

	// move all DAI-HRD to vat
	const attodaiHrdBalance = await daiHrd.balanceOf_(signer.address)
	if (attodaiHrdBalance > 0) await daiHrd.withdrawVatDai(signer.address, attodaiHrdBalance)

	// move all DAI to vat
	const attodaiBalance = await dai.balanceOf_(signer.address)
	if (attodaiBalance > 0) await daiJoin.join(signer.address, attodaiBalance)

	// clear all debt
	const attodaiDebt = (await vat.urns_(ethId, signer.address)).art
	if (attodaiDebt > 0) await vat.frob(ethId, signer.address, signer.address, signer.address, 0n, attodaiDebt * -1n)

	// unlock all ETH
	const attoethLocked = (await vat.urns_(ethId, signer.address)).ink
	if (attoethLocked > 0) await vat.frob(ethId, signer.address, signer.address, signer.address, attoethLocked * -1n, 0n)

	// withdraw all ETH
	const attovatEthBalance = await vat.gem_(ethId, signer.address)
	if (attovatEthBalance > 0) await ethJoin.exit(signer.address, attovatEthBalance)
}

async function resetMakerWithTestAccount() {
	const actor = await createTestActorFromAddresses('http://localhost:8545', DependenciesImpl)
	await resetMaker(actor)
}

if (require.main === module) {
	// necessary so node crypto looks like web crypto, which @zoltu/ethereum-crypto needs
	globalThis.crypto = new Crypto()

	resetMakerWithTestAccount().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
