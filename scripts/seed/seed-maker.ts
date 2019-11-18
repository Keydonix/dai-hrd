import { Crypto } from '@peculiar/webcrypto'
import { DependenciesImpl } from '../libraries/generated-dependencies'
import { daiToAttodai } from '../libraries/type-helpers'
import { createTestActorFromAddresses, Actor } from '../libraries/actor'
import { resetMaker } from './reset-maker'

export async function seedMaker(actor: Actor) {
	await resetMaker(actor)

	// set DSR
	const dsr = 1_000_000_001_500_000_000_000_000_000n
	if (await actor.pot.dsr_() !== dsr) await actor.setDsr.setDsr(dsr)

	await generateDai(actor, daiToAttodai(10_000n))
}

export async function generateDai(actor: Actor, attodai: bigint) {
	// get the collatoral ID
	const ethId = await actor.ethJoin.ilk_()

	// figure out how much ETH we need to cover
	const rontodaiPerEth = (await actor.vat.ilks_(ethId)).spot
	const attoethToDeposit = attodai * 10n**27n / rontodaiPerEth * 2n

	// deposit ETH to VatETH
	await actor.ethJoin.join(actor.signer.address, attoethToDeposit)

	// create CDP to get VatDAI
	await actor.vat.frob(ethId, actor.signer.address, actor.signer.address, actor.signer.address, attoethToDeposit, daiToAttodai(10_000n))

	// deposit VatDAI into DAI
	await actor.daiJoin.exit(actor.signer.address, daiToAttodai(10_000n))
}

async function seedMakerWithTestAccount() {
	const actor = await createTestActorFromAddresses('https://dev-parity.keydonix.com', DependenciesImpl)
	return await seedMaker(actor)
}

if (require.main === module) {
	// necessary so node crypto looks like web crypto, which @zoltu/ethereum-crypto needs
	globalThis.crypto = new Crypto()

	seedMakerWithTestAccount().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
