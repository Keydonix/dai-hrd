import { promises as fs } from 'fs'
import fetch from 'node-fetch'
import { MnemonicSigner } from './mnemonic-signer';
import { PrivateKeySigner } from './privatekey-signer';
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc';
import { Dai, Vat, Pot, DaiJoin, ETHJoin, SetDsr } from '../../generated/maker';
import { Factory as UniswapFactory } from '../../generated/uniswap'
import { DaiHrd, Dependencies } from '../../generated/dai-hrd';
import { JsonRpc } from '@zoltu/ethereum-types';
import { lastDeployAddressPath } from './paths';
import { fileExists } from './filesystem-extensions';

export interface Actor {
	address: bigint
	signer: MnemonicSigner | PrivateKeySigner
	rpc: FetchJsonRpc
	dependencies: Dependencies
	uniswapFactory: UniswapFactory
	dai:Dai
	vat:Vat
	pot: Pot
	daiJoin: DaiJoin
	ethJoin: ETHJoin
	daiHrd: DaiHrd
	setDsr: SetDsr
}

export async function duplicateActor(sourceActor: Actor, signer: MnemonicSigner | PrivateKeySigner, DependenciesConstructor: new (rpc: JsonRpc) => Dependencies): Promise<Actor> {
	const rpc = new FetchJsonRpc(sourceActor.rpc.jsonRpcEndpoint, sourceActor.rpc.fetch, sourceActor.rpc.getGasPriceInAttoeth, async () => signer.address, signer.sign)
	const dependencies = new DependenciesConstructor(rpc)
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

async function tryCreateActorFromAddresses(signer: MnemonicSigner | PrivateKeySigner, rpc: FetchJsonRpc, dependencies: Dependencies): Promise<Actor | undefined> {
	if (!await fileExists(lastDeployAddressPath)) return undefined
	const json = await fs.readFile(lastDeployAddressPath, 'utf8')
	const { uniswapFactory, dai, vat, pot, daiJoin, ethJoin, daiHrd, setDsr } = JSON.parse(json, (_, value) => typeof value === 'string' ? BigInt(value) : value) as Record<string, bigint>
	return {
		address: signer.address,
		signer: signer,
		rpc: rpc,
		dependencies: dependencies,
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

export async function tryCreateTestActorFromAddresses(jsonRpcEndpoint: string, DependenciesConstructor: new (rpc: JsonRpc) => Dependencies): Promise<Actor | undefined> {
	const signer = await MnemonicSigner.createTest(0)
	const rpc = new FetchJsonRpc(jsonRpcEndpoint, fetch, async () => 10n**9n, async () => signer.address, signer.sign)
	const dependencies = new DependenciesConstructor(rpc)
	return await tryCreateActorFromAddresses(signer, rpc, dependencies)
}

export async function createTestActorFromAddresses(jsonRpcEndpoint: string, DependenciesConstructor: new (rpc: JsonRpc) => Dependencies): Promise<Actor> {
	const actor = await tryCreateTestActorFromAddresses(jsonRpcEndpoint, DependenciesConstructor)
	if (actor === undefined) throw new Error(`No addreses file found at ${lastDeployAddressPath}`)
	return actor
}
