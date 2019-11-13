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

export class TestDependencies {
	constructor(
		private readonly rpc: JsonRpc
	) {}
	public async call(address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<Uint8Array> {
		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		return await this.rpc.offChainContractCall({
			to: address,
			data: data,
			...(value !== undefined ? {value} : {}),
		})
	}
	public async submitTransaction(address: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<TransactionReceipt> {
		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		return await this.rpc.onChainContractCall({
			to: address,
			data: data,
			...(value !== undefined ? {value} : {}),
			...getGasLimit(methodSignature),
		})
	}
}

function getGasLimit(methodSignature: string): {gasLimit?: bigint} {
	if (methodSignature in explicitGasPrices) {
		return { gasLimit: explicitGasPrices[methodSignature] }
	} else {
		return {}
	}
}

const explicitGasPrices: Record<string, bigint> = {
	'deposit(uint256)': 292000n,
	'withdrawVatDai(address,uint256)': 180000n,
	'withdrawToDenominatedInDai(address,uint256)': 263000n,
}
