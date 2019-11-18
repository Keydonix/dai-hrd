import { Dependencies, TransactionReceipt as PartialTransactionReceipt } from '@keydonix/dai-hrd-contracts'
import { EncodableArray, JsonRpcMethod, RawTransactionReceipt, TransactionReceipt, Bytes } from '@zoltu/ethereum-types';
import { encodeMethod } from '@zoltu/ethereum-abi-encoder';
import { keccak256 } from '@zoltu/ethereum-crypto';
import { getGasLimit } from './gas-limits';
import { ReadonlyFetchJsonRpcDependencies } from './readonly-fetch-dependencies';

interface JsonRpcLike { jsonrpc:'2.0', id:unknown, result:unknown }

declare global {
	interface Window {
		ethereum: {
			sendAsync: (options: { jsonrpc: '2.0', method: JsonRpcMethod | 'eth_requestAccounts', params: readonly unknown[] }, callback: (error: Error, response: JsonRpcLike) => void) => void
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
		return Bytes.fromHexString(result.result as string)
	}

	public readonly submitTransaction = async (address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<PartialTransactionReceipt> => {
		if (!this.enabled) await this.enable()
		if (!this.enabled) throw new Error(`You must enable Ethereum Access to utilize all of the features of this application.`)
		if (!this.address) throw new Error(`Did not find any Ethereum address set.  This is highly unusual.`)

		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		const gasLimit = getGasLimit(methodSignature)
		const gas = (gasLimit.gasLimit !== undefined) ? { gas: numberToHexString(gasLimit.gasLimit) } : {}
		const transactionHashString = await this.send('eth_sendTransaction', {
			from: addressToHexString(this.address),
			to: addressToHexString(address),
			data: Bytes.fromByteArray(data).to0xString(),
			value: numberToHexString(value),
			...gas,
		})
		const transactionHash = BigInt(transactionHashString.result as string)
		let receipt = await this.getTransactionReceipt(transactionHash)
		while (receipt === null || receipt.blockNumber === null) {
			await sleep(1000)
			receipt = await this.getTransactionReceipt(transactionHash)
		}
		if (!receipt.status) throw new Error(`Transaction mined, but failed.`)
		return receipt
	}

	public readonly enable = async (): Promise<readonly bigint[]> => {
		const response = await this.send('eth_requestAccounts')
		this.enabled = true
		const result = response.result as readonly string[]
		const accounts = result.map(addressString => BigInt(addressString))
		if (accounts.length > 0) this.address = accounts[0]
		return accounts
	}

	public readonly noBrowserExtensionNeeded = () => !!window.ethereum

	private readonly send = async (method: JsonRpcMethod | 'eth_requestAccounts', ...params: unknown[]): Promise<JsonRpcLike> => {
		return new Promise((resolve, reject) => {
			window.ethereum.sendAsync({ jsonrpc: '2.0', method, params }, (error, result) => error ? reject(error) : resolve(result))
		})
	}

	private readonly getTransactionReceipt = async (transactionHash: bigint): Promise<TransactionReceipt | null> => {
		const response = await this.send('eth_getTransactionReceipt', hashToHexString(transactionHash))
		if (response.result === null) return null
		return new TransactionReceipt(response.result as RawTransactionReceipt)
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
