import { Dependencies, TransactionReceipt as PartialTransactionReceipt } from '@keydonix/dai-hrd'
import { EncodableArray, JsonRpcMethod, RawTransactionReceipt, TransactionReceipt, Bytes } from '@zoltu/ethereum-types';
import { encodeMethod } from '@zoltu/ethereum-abi-encoder';
import { keccak256 } from '@zoltu/ethereum-crypto';

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

	public constructor(
		public readonly fallbackDependencies: Dependencies
	) {}

	readonly call = async (address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<Uint8Array> => {
		if (!this.enabled) return await this.fallbackDependencies.call(address, methodSignature, methodParameters, value)

		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		const result = await this.send('eth_call', {
			to: addressToHexString(address),
			data: Bytes.fromByteArray(data).to0xString(),
			value: numberToHexString(value),
		})
		return Bytes.fromHexString(result.result as string)
	}

	readonly submitTransaction = async (address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<PartialTransactionReceipt> => {
		if (!this.enabled) await this.enable()
		if (!this.enabled) throw new Error(`You must enable Ethereum Access to utilize all of the features of this application.`)
		if (!this.address) throw new Error(`Did not find any Ethereum address set.  This is highly unusual.`)

		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		const transactionHashString = await this.send('eth_sendTransaction', {
			from: addressToHexString(this.address),
			to: addressToHexString(address),
			data: Bytes.fromByteArray(data).to0xString(),
			value: numberToHexString(value),
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

	readonly getAddress = async (): Promise<bigint> => {
		if (!this.enabled) await this.enable()
		const address = await this.tryGetAddress()
		if (address === undefined) throw new Error(`Unable to get address.  Most likely cause: User did not enable MetaMask.`)
		return address
	}

	readonly tryGetAddress = async (): Promise<bigint | undefined> => {
		if (!this.enabled) return undefined
		const response = await this.send('eth_accounts')
		const accounts = response.result as readonly string[]
		if (accounts.length === 0) return undefined
		return BigInt(accounts[0])
	}

	enable = async (): Promise<readonly bigint[]> => {
		const response = await this.send('eth_requestAccounts')
		this.enabled = true
		const result = response.result as readonly string[]
		const accounts = result.map(addressString => BigInt(addressString))
		if (accounts.length > 0) this.address = accounts[0]
		return accounts
	}

	send = async (method: JsonRpcMethod | 'eth_requestAccounts', ...params: unknown[]): Promise<JsonRpcLike> => {
		return new Promise((resolve, reject) => {
			window.ethereum.sendAsync({ jsonrpc: '2.0', method, params }, (error, result) => error ? reject(error) : resolve(result))
		})
	}

	getTransactionReceipt = async (transactionHash: bigint): Promise<TransactionReceipt> => {
		const response = await this.send('eth_getTransactionReceipt', hashToHexString(transactionHash))
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
