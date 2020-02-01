import { Dependencies, TransactionReceipt as PartialTransactionReceipt } from '@keydonix/dai-hrd-contracts'
import { EncodableArray, JsonRpcMethod, RawTransactionReceipt, TransactionReceipt, Bytes } from '@zoltu/ethereum-types';
import { encodeMethod } from '@zoltu/ethereum-abi-encoder';
import { keccak256 } from '@zoltu/ethereum-crypto';
import { ReadonlyFetchJsonRpcDependencies } from './readonly-fetch-dependencies';

declare global {
	interface Window {
		ethereum: {
			sendAsync: (options: { jsonrpc: '2.0', method: JsonRpcMethod | 'eth_requestAccounts', params: readonly unknown[] }, callback: (error: Error, response: unknown) => void) => void
		}
	}
}

export class EthereumBrowserDependencies implements Dependencies {
	public enabled: boolean = false
	public address: bigint | undefined = undefined
	private readonly fallbackDependencies: ReadonlyFetchJsonRpcDependencies

	public constructor(jsonRpcEndpoint: string) {
		this.fallbackDependencies = new ReadonlyFetchJsonRpcDependencies(jsonRpcEndpoint)
	}

	public readonly call = async (address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<Uint8Array> => {
		if (!this.enabled) return await this.fallbackDependencies.call(address, methodSignature, methodParameters, value)

		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		const result = await this.send('eth_call', {
			to: addressToHexString(address),
			data: Bytes.fromByteArray(data).to0xString(),
			value: numberToHexString(value),
		})
		return Bytes.fromHexString(result as string)
	}

	public readonly submitTransaction = async (address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<PartialTransactionReceipt> => {
		if (!this.enabled) await this.enable()
		if (!this.enabled) throw new Error(`You must enable Ethereum Access to utilize all of the features of this application.`)
		if (!this.address) throw new Error(`Did not find any Ethereum address set.  This is highly unusual.`)

		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		const transaction = {
			from: addressToHexString(this.address),
			to: addressToHexString(address),
			data: Bytes.fromByteArray(data).to0xString(),
			value: numberToHexString(value),
		} as const
		const gasEstimate = await this.estimateGas(transaction)
		const transactionHashString = await this.send('eth_sendTransaction', { ...transaction, gas: numberToHexString(gasEstimate + 55_000n)})
		const transactionHash = BigInt(transactionHashString as string)
		let receipt = await this.getTransactionReceipt(transactionHash)
		while (receipt === null || receipt.blockNumber === null) {
			await sleep(1000)
			receipt = await this.getTransactionReceipt(transactionHash)
		}
		if (!receipt.status) throw new Error(`Transaction mined, but failed.`)
		return receipt
	}

	public readonly enable = async (): Promise<readonly bigint[]> => {
		let response = await this.send('eth_requestAccounts')
		this.enabled = true
		const result = response as readonly string[]
		const accounts = result.map(addressString => BigInt(addressString))
		if (accounts.length > 0) this.address = accounts[0]
		return accounts
	}

	public readonly noBrowserExtensionNeeded = () => !!window.ethereum

	private readonly send = async (method: JsonRpcMethod | 'eth_requestAccounts', ...params: unknown[]): Promise<unknown> => {
		return new Promise((resolve, reject) => {
			window.ethereum.sendAsync({ jsonrpc: '2.0', method, params }, (error, result) => {
				if (error) return reject(error)
				// https://github.com/MetaMask/metamask-extension/issues/7970
				if (isJsonRpcLike(result)) return resolve(result.result)
				return resolve(result)
			})
		})
	}

	private readonly estimateGas = async (transaction: unknown): Promise<bigint> => {
		const response = await this.send('eth_estimateGas', transaction)
		if (!/0x[a-zA-Z0-9]+/.test(response as string)) throw new Error(`Unexpected result from 'eth_estimateGas': ${response}`)
		return BigInt(response)
	}

	private readonly getTransactionReceipt = async (transactionHash: bigint): Promise<TransactionReceipt | null> => {
		const response = await this.send('eth_getTransactionReceipt', hashToHexString(transactionHash))
		if (response === null) return null
		return new TransactionReceipt(response as RawTransactionReceipt)
	}
}

async function sleep(milliseconds: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function addressToHexString(value: bigint): string {
	return `0x${value.toString(16).padStart(40,'0')}`
}

function numberToHexString(value: bigint): string {
	return `0x${value.toString(16)}`
}

function hashToHexString(value: bigint): string {
	return `0x${value.toString(16).padStart(64,'0')}`
}

function isJsonRpcLike(maybe: unknown): maybe is { result: unknown } {
	return typeof maybe === 'object' && maybe !== null && 'result' in maybe
}
