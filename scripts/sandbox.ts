import { Crypto } from '@peculiar/webcrypto'
import { DependenciesImpl } from './libraries/generated-dependencies'
import { attodaiToDai, bigintRontoToDecimalString, bigintAttoToDecimalString, bigintAttorontoToDecimalString } from './libraries/type-helpers'
import { createTestActorFromAddresses } from './libraries/actor'

export async function sandbox() {
	const alice = await createTestActorFromAddresses('https://dev-parity.keydonix.com', DependenciesImpl)

	console.log(await alice.dai.approve(alice.daiHrd.address, 0n))
	console.log(alice.signer.address)
	console.log(alice.signer.privateKey)

	const EthId = await alice.ethJoin.ilk_()

	console.log(`ETH Price: ${bigintRontoToDecimalString((await alice.vat.ilks_(EthId)).spot)}`)
	console.log(`ETH Rate: ${bigintRontoToDecimalString((await alice.vat.ilks_(EthId)).rate)}`)
	console.log(`DSR: ${bigintRontoToDecimalString(await alice.pot.dsr_())}`)
	console.log(`ETH Debt Ceiling: ${bigintAttorontoToDecimalString((await alice.vat.ilks_(EthId)).line)}`)
	console.log(`Global Debt Ceiling: ${bigintAttorontoToDecimalString(await alice.vat.Line_())}`)
	console.log(`ETH Balance: ${bigintAttoToDecimalString(await alice.rpc.getBalance(alice.signer.address))}`)
	console.log(`DAI balance: ${bigintAttoToDecimalString(await alice.dai.balanceOf_(alice.signer.address))}`)
	console.log(`Deposited ETH: ${bigintAttoToDecimalString(await alice.vat.gem_(EthId, alice.signer.address))}`)
	console.log(`VatDAI Balance: ${bigintAttorontoToDecimalString(await alice.vat.dai_(alice.signer.address))}`)
	console.log(`Locked ETH: ${bigintAttoToDecimalString((await alice.vat.urns_(EthId, alice.signer.address)).ink)}`)
	console.log(`DAI Debt: ${attodaiToDai((await alice.vat.urns_(EthId, alice.signer.address)).art)}`)
}

if (require.main === module) {
	// necessary so node crypto looks like web crypto, which @zoltu/ethereum-crypto needs
	globalThis.crypto = new Crypto()

	sandbox().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
