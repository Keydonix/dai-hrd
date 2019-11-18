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
import { Factory as UniswapFactory } from '../../generated/uniswap'
import { Dai, Vat, Pot, DaiJoin, ETHJoin } from '../../generated/maker'
import { mnemonic } from '@zoltu/ethereum-crypto'
import { addressToChecksummedString } from '@zoltu/ethereum-crypto/output-node/ethereum'

export async function testnetDeploy(rpc: JsonRpc, dependencies: Dependencies) {
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
	const daiHrd = await deployDaiHrd(rpc, dependencies, 0n)

	console.log('deployment complete')

	return { uniswapFactory, dai, vat, pot, daiJoin, ethJoin, daiHrd, setDsr }
}

export async function mainnetDeploy(rpc: JsonRpc, dependencies: Dependencies) {
	const uniswapFactory = new UniswapFactory(dependencies, 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95n)
	const dai = new Dai(dependencies, 0x6b175474e89094c44da98b954eedeac495271d0fn)
	const vat = new Vat(dependencies, 0x35d1b3f3d7966a1dfe207aa4514c12a259a0492bn)
	const pot = new Pot(dependencies, 0x197e90f9fad81970ba7976f33cbd77088e5d7cf7n)
	const daiJoin = new DaiJoin(dependencies, 0x9759a6ac90977b93b58547b4a71c78317f391a28n)
	const ethJoin = new ETHJoin(dependencies, 0x2f0b23f53734252bda2277357e97e1517d6b042an)
	// we recompile DaiHrd because we now have the appropriate addreses to inject, we didn't on the first pass
	console.log('recompiling DaiHrd...')
	await compileDaiHrd(dai.address, pot.address, vat.address, daiJoin.address, uniswapFactory.createExchange_)
	console.log('deploying DaiHrd...')
	const daiHrd = await deployDaiHrd(rpc, dependencies, 0x9062c0a6dbd6108336bcbe4593a3d1ce05512069n)

	return { uniswapFactory, dai, vat, pot, daiJoin, ethJoin, daiHrd }
}

export async function deployAndCache(rpc: JsonRpc, dependencies: Dependencies, deployer: (rpc: JsonRpc, dependencies: Dependencies) => Promise<Record<string, {address: bigint}>>) {
	const deployments = await deployer(rpc, dependencies)
	console.log(`DAI-HRD: ${deployments.daiHrd.address}`)
	await ensureDirectoryExists(testDbDirectory)
	const cacheContents = Object.entries(deployments).reduce((addresses, [key, value]) => ({...addresses, [key]: value.address }), {})
	await fs.writeFile(lastDeployAddressPath, JSON.stringify(cacheContents, (_, value) => (typeof value === 'bigint') ? `0x${value.toString(16)}`: value))
	return deployments
}

export async function deployToLocalTestNetwork() {
	const jsonRpcEndpoint = 'https://dev-parity.keydonix.com'
	const signer = await MnemonicSigner.createTest(0)
	const gasPrice = 10n**9n
	const rpc = new FetchJsonRpc(jsonRpcEndpoint, fetch, async () => gasPrice, async () => signer.address, signer.sign)
	const dependencies = new DependenciesImpl(rpc)
	await deployAndCache(rpc, dependencies, testnetDeploy)
}

export async function deployToMainnet() {
	const jsonRpcEndpoint = 'https://parity.zoltu.io'
	const words = await mnemonic.generateRandom(128)
	console.log(words.join(' '))
	const signer = await MnemonicSigner.create(words, 0)
	console.log(await addressToChecksummedString(signer.address))
	const gasPrice = 51n * 10n**8n
	const rpc = new FetchJsonRpc(jsonRpcEndpoint, fetch, async () => gasPrice, async () => signer.address, signer.sign)
	const dependencies = new DependenciesImpl(rpc)
	await deployAndCache(rpc, dependencies, mainnetDeploy)
}

if (require.main === module) {
	// necessary so node crypto looks like web crypto, which @zoltu/ethereum-crypto needs
	globalThis.crypto = new Crypto()

	deployToMainnet().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
