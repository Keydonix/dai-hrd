import { promises as fs } from 'fs'
import fetch from 'node-fetch'
import * as ganache from 'ganache-core'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { MnemonicSigner } from '../scripts/libraries/mnemonic-signer'
import { Dai, Vat, Pot, DaiJoin, ETHJoin, SetDsr } from '../generated/maker'
import { DaiHrd } from '../generated/dai-hrd'
import { Factory as UniswapFactory } from '../generated/uniswap'
import { deploy } from '../scripts/deploy'
import { TestDependencies } from './test-dependencies'
import { JsonRpc } from '@zoltu/ethereum-types'
import { ensureDirectoryExists, fileExists } from '../scripts/libraries/filesystem-extensions'
import { PrivateKeySigner } from '../scripts/libraries/privatekey-signer'
import { testAddressesPath, testDbDirectory } from '../scripts/libraries/paths'
// import MemDown from 'memdown'

export interface Actor {
	address: bigint
	signer: MnemonicSigner | PrivateKeySigner
	rpc: FetchJsonRpc
	dependencies: TestDependencies
	uniswapFactory: UniswapFactory
	dai:Dai
	vat:Vat
	pot: Pot
	daiJoin: DaiJoin
	ethJoin: ETHJoin
	daiHrd: DaiHrd
	setDsr: SetDsr
}

export interface GanacheControls {
	mine: (timestampSeconds: number) => Promise<void>
	advanceTime: (seconds: number) => Promise<void>
	snapshot: () => Promise<bigint>
	revert: (id: bigint) => Promise<void>
}

export async function duplicateActor(sourceActor: Actor, signer: MnemonicSigner | PrivateKeySigner): Promise<Actor> {
	const rpc = new FetchJsonRpc(sourceActor.rpc.jsonRpcEndpoint, sourceActor.rpc.fetch, sourceActor.rpc.getGasPriceInAttoeth, async () => signer.address, signer.sign)
	const dependencies = new TestDependencies(rpc)
	return {
		address: signer.address,
		signer,
		rpc,
		dependencies,
		uniswapFactory: new UniswapFactory(dependencies, sourceActor.uniswapFactory.address),
		dai: new Dai(dependencies, sourceActor.dai.address),
		vat: new Vat(dependencies, sourceActor.vat.address),
		pot: new Pot(dependencies, sourceActor.pot.address),
		daiJoin: new DaiJoin(dependencies, sourceActor.daiJoin.address),
		ethJoin: new ETHJoin(dependencies, sourceActor.ethJoin.address),
		daiHrd: new DaiHrd(dependencies, sourceActor.daiHrd.address),
		setDsr: new SetDsr(dependencies, sourceActor.setDsr.address),
	}
}

export async function testDeploy(jsonRpcEndpoint: string, mnemonic: string[]): Promise<Actor> {
	const gasPrice = 1n
	const signer = await MnemonicSigner.create(mnemonic, 0)
	// TODO: create a system for supporting different targets to test against.  For now, uncomment below and comment above if you want to test against external node
	// mnemonic
	// const signer = await PrivateKeySigner.create(0xfae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5an)
	const rpc = new FetchJsonRpc(jsonRpcEndpoint, fetch, async () => gasPrice, async () => signer.address, signer.sign)
	const dependencies = new TestDependencies(rpc)
	const deployments = await tryReadAddresses(dependencies) || await deployAndCache(rpc, dependencies)
	return { address: signer.address, signer: signer, rpc: rpc, dependencies: dependencies, ...deployments }
}

export async function startGanache(mnemonic: string): Promise<number> {
	// start ganache server in-memory
	const gasLimit = 9600000
	// set logger to `console` for verbose ganache logging (useful for debugging failing tests)
	const logger = {log: () => {}}
	// TODO: redeploy if any file in build-cache is newer than addresses.json
	// await fs.rmdir(dbPath, { recursive: true })
	await ensureDirectoryExists(testDbDirectory)
	const server = ganache.server({ gasLimit, mnemonic, logger, db_path: testDbDirectory, /* db: MemDown() */ })
	// CONSIDER: should we be waiting for listen to come back with some sort of "its warm" callback?
	server.listen(0, (error: Error, _notification: unknown) => {
		if (error) console.error(error)
		// else if (notification) console.log(notification)
		// else console.log(`Unknown ganache server event.`)
	})
	return server.address().port
}

export function getGanacheControls(rpc: JsonRpc): GanacheControls {
	return {
		mine: async (timestampSeconds: number) => {
			await rpc.remoteProcedureCall({ id: 1, jsonrpc: '2.0', method: 'evm_mine' as unknown as 'eth_chainId' /* lies! */, params: [timestampSeconds] })
		},
		advanceTime: async (seconds: number) => {
			await rpc.remoteProcedureCall({ id: 1, jsonrpc: '2.0', method: 'evm_increaseTime' as unknown as 'eth_chainId' /* lies! */, params: [seconds] })
		},
		snapshot: async () => {
			const response = await rpc.remoteProcedureCall({ id: 1, jsonrpc: '2.0', method: 'evm_snapshot' as unknown as 'eth_chainId' /* lies! */, params: [] })
			return BigInt(response.result)
		},
		revert: async (id: bigint) => {
			await rpc.remoteProcedureCall({ id: 1, jsonrpc: '2.0', method: 'evm_revert' as unknown as 'eth_chainId' /* lies! */, params: [`0x${id.toString(16)}`] })
		},
	}
}

async function tryReadAddresses(dependencies: TestDependencies) {
	if (!await fileExists(testAddressesPath)) return undefined
	const json = await fs.readFile(testAddressesPath, 'utf8')
	const { uniswapFactory, dai, vat, pot, daiJoin, ethJoin, daiHrd, setDsr } = JSON.parse(json, (_, value) => typeof value === 'string' ? BigInt(value) : value) as Record<'uniswapFactory' |'dai' |'vat' |'pot' |'daiJoin' |'ethJoin' |'daiHrd'|'setDsr', bigint>
	return {
		uniswapFactory: new UniswapFactory(dependencies, uniswapFactory),
		dai: new Dai(dependencies, dai),
		vat: new Vat(dependencies, vat),
		pot: new Pot(dependencies, pot),
		daiJoin: new DaiJoin(dependencies, daiJoin),
		ethJoin: new ETHJoin(dependencies, ethJoin),
		daiHrd: new DaiHrd(dependencies, daiHrd),
		setDsr: new SetDsr(dependencies, setDsr),
	}
}

async function deployAndCache(rpc: JsonRpc, dependencies: TestDependencies) {
	const deployments = await deploy(rpc, dependencies)
	await ensureDirectoryExists(testDbDirectory)
	const cacheContents = Object.entries(deployments).reduce((addresses, [key, value]) => ({...addresses, [key]: value.address }), {})
	await fs.writeFile(testAddressesPath, JSON.stringify(cacheContents, (_, value) => (typeof value === 'bigint') ? `0x${value.toString(16)}`: value))
	return deployments
}
