import fetch from 'node-fetch'
import { Crypto } from '@peculiar/webcrypto'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { MnemonicSigner } from '../libraries/mnemonic-signer'
import { deployMaker, seedMaker } from './maker'
import { deployUniswap } from './uniswap'
import { deployErc1820 } from './erc1820'
import { compileDaiHrd } from '../compile/dai-hrd'
import { deployDaiHrd } from './dai-hrd'
import { Dependencies } from '../../generated/dai-hrd'
import { DependenciesImpl } from '../libraries/generated-dependencies'
import { JsonRpc } from '@zoltu/ethereum-types'

// necessary so node crypto looks like web crypto, which @zoltu/ethereum-crypto needs
globalThis.crypto = new Crypto()

export async function deploy(rpc: JsonRpc, dependencies: Dependencies) {
	console.log('deploying ERC1820...')
	await deployErc1820(rpc, dependencies)

	console.log('deploying Uniswap...')
	const uniswapFactory = await deployUniswap(rpc, dependencies)

	console.log('deploying Maker...')
	const { dai, vat, pot, daiJoin, ethJoin } = await deployMaker(rpc, dependencies)

	// we recompile DaiHrd because we now have the appropriate addreses to inject, we didn't on the first pass
	console.log('recompiling DaiHrd...')
	await compileDaiHrd(dai.address, pot.address, vat.address, daiJoin.address, uniswapFactory.createExchange_)
	console.log('deploying DaiHrd...')
	const daiHrd = await deployDaiHrd(rpc, dependencies)

	console.log('seeding Maker...')
	const account = await rpc.coinbase() || (() => {throw new Error(`Coinbase required to seed maker.`)})()
	await seedMaker(account!, vat, daiJoin, ethJoin)

	console.log('deployment complete')

	return { uniswapFactory, dai, vat, pot, daiJoin, ethJoin, daiHrd }
}

async function deployToLocalhost() {
	const jsonRpcEndpoint = 'http://localhost:8545'
	const gasPrice = 10n**9n
	const mnemonic = ['zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'wrong']
	const signer = await MnemonicSigner.create(mnemonic)
	const rpc = new FetchJsonRpc(jsonRpcEndpoint, fetch, async () => gasPrice, async () => signer.address, signer.sign)
	const dependencies = new DependenciesImpl(rpc)
	await deploy(rpc, dependencies)
}

if (require.main === module) {
	deployToLocalhost().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
