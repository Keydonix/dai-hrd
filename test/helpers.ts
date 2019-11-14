import { createServer } from 'net'
import fetch from 'node-fetch'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { MnemonicSigner } from '../scripts/libraries/mnemonic-signer'
import { TestDependencies } from './test-dependencies'
import { JsonRpc } from '@zoltu/ethereum-types'
import { PrivateKeySigner } from '../scripts/libraries/privatekey-signer'
import { deployAndCache } from '../scripts/deploy'
import { ethToAttoeth } from '../scripts/libraries/type-helpers'
import { startGanache } from '../scripts/libraries/ganache'
import { Actor, tryCreateTestActorFromAddresses } from '../scripts/libraries/actor'
// import MemDown from 'memdown'

export interface GanacheControls {
	mine: (timestampSeconds: number) => Promise<void>
	advanceTime: (seconds: number) => Promise<void>
	snapshot: () => Promise<bigint>
	revert: (id: bigint) => Promise<void>
}

export async function startGanacheIfNecessary(signer: MnemonicSigner | PrivateKeySigner): Promise<number> {
	// if there is a server listening on http://localhost:8545 and if it looks like a test server, then use that
	const portInUse = await new Promise(resolve => {
		const server = createServer()
		server.once('error', () => resolve(true))
		server.once('listening', () => {server.close(); resolve(false)})
		server.listen(8545)
	})
	if (portInUse) {
		const rpc = new FetchJsonRpc(`http://localhost:8545`, fetch, async () => 10n**9n, async () => signer.address, signer.sign)
		const signerBalance = await rpc.getBalance(signer.address)
		if (signerBalance >= ethToAttoeth(1000n)) return 8545
	}
	return await startGanache()
}

export async function testDeploy(jsonRpcEndpoint: string, signer: MnemonicSigner | PrivateKeySigner): Promise<Actor> {
	const gasPrice = 10n**9n
	const rpc = new FetchJsonRpc(jsonRpcEndpoint, fetch, async () => gasPrice, async () => signer.address, signer.sign)
	const dependencies = new TestDependencies(rpc)
	const deployments = await tryCreateTestActorFromAddresses(jsonRpcEndpoint, TestDependencies) || await deployAndCache(rpc, dependencies)
	return { address: signer.address, signer: signer, rpc: rpc, dependencies: dependencies, ...deployments }
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

export async function mineBlock(actor: Actor) {
	return actor.rpc.sendEth(actor.signer.address, 0n)
}
