import { EncodableArray, encodeMethod } from '@zoltu/ethereum-abi-encoder';
import { JsonRpc } from '@zoltu/ethereum-types';
import { keccak256 } from '@zoltu/ethereum-crypto';

interface Log {
	readonly topics: ReadonlyArray<bigint>
	readonly data: Uint8Array
}
interface TransactionReceipt {
	readonly status: boolean
	readonly logs: Iterable<Log>
}

export class DependenciesImpl {
	constructor(
		private readonly rpc: JsonRpc
	) {}
	public async call(address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<Uint8Array> {
		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		return await this.rpc.offChainContractCall({ to: address, data, ...(value !== undefined ? {value} : {}) })
	}
	public async submitTransaction(address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<TransactionReceipt> {
		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		return await this.rpc.onChainContractCall({ to: address, data, ...(value !== undefined ? {value} : {}) })
	}
}
