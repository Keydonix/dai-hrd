import { promises as fs } from 'fs'
import fetch from 'node-fetch'
import { Crypto } from '@peculiar/webcrypto'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { deployMaker } from './maker'
import { deployUniswap } from './uniswap'
import { deployErc1820 } from './erc1820'
import { compileDaiHrd } from '../compile/dai-hrd'
import { deployDaiHrd } from './dai-hrd'
import { Dependencies } from '../../generated/dai-hrd'
import { DependenciesImpl } from '../libraries/generated-dependencies'
import { JsonRpc } from '@zoltu/ethereum-types'
import { ensureDirectoryExists } from '../libraries/filesystem-extensions'
import { testDbDirectory, lastDeployAddressPath } from '../libraries/paths'
import { MnemonicSigner } from '../libraries/mnemonic-signer'

async function deploy(rpc: JsonRpc, dependencies: Dependencies) {
	console.log('deploying ERC1820...')
	await deployErc1820(rpc, dependencies)

	console.log('deploying Uniswap...')
	const uniswapFactory = await deployUniswap(rpc, dependencies)

	console.log('deploying Maker...')
	const { dai, vat, pot, daiJoin, ethJoin, setDsr } = await deployMaker(rpc, dependencies)

	// we recompile DaiHrd because we now have the appropriate addreses to inject, we didn't on the first pass
	console.log('recompiling DaiHrd...')
	await compileDaiHrd(dai.address, pot.address, vat.address, daiJoin.address, uniswapFactory.createExchange_)
	console.log('deploying DaiHrd...')
	const daiHrd = await deployDaiHrd(rpc, dependencies)

	console.log('deployment complete')

	return { uniswapFactory, dai, vat, pot, daiJoin, ethJoin, daiHrd, setDsr }
}

export async function deployAndCache(rpc: JsonRpc, dependencies: Dependencies) {
	const deployments = await deploy(rpc, dependencies)
	await ensureDirectoryExists(testDbDirectory)
	const cacheContents = Object.entries(deployments).reduce((addresses, [key, value]) => ({...addresses, [key]: value.address }), {})
	await fs.writeFile(lastDeployAddressPath, JSON.stringify(cacheContents, (_, value) => (typeof value === 'bigint') ? `0x${value.toString(16)}`: value))
	return deployments
}

export async function deployToLocalTestNetwork() {
	const jsonRpcEndpoint = 'http://localhost:8545'
	const signer = await MnemonicSigner.createTest(0)
	const gasPrice = 10n**9n
	const rpc = new FetchJsonRpc(jsonRpcEndpoint, fetch, async () => gasPrice, async () => signer.address, signer.sign)
	const dependencies = new DependenciesImpl(rpc)
	await deployAndCache(rpc, dependencies)
}

if (require.main === module) {
	// necessary so node crypto looks like web crypto, which @zoltu/ethereum-crypto needs
	globalThis.crypto = new Crypto()

	deployToLocalTestNetwork().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
