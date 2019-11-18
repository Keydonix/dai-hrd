import { Dependencies, TransactionReceipt as PartialTransactionReceipt } from '@keydonix/dai-hrd-contracts'
import { Bytes } from '@zoltu/ethereum-types'
import { ethereum, keccak256 } from '@zoltu/ethereum-crypto'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { encodeMethod, EncodableArray } from '@zoltu/ethereum-abi-encoder'
import { getGasLimit } from './gas-limits'


export class PrivateFetchDependencies implements Dependencies {
	public enabled = false
	public readonly address = 0xfc2077ca7f403cbeca41b1b0f62d91b5ea631b5en
	public readonly rpc: FetchJsonRpc

	public constructor(jsonRpcEndpoint: string) {
		const signer = async (message: Bytes): Promise<{ r: bigint, s: bigint, yParity: 'even'|'odd' }> => {
			const signature = await ethereum.signRaw(0x7af65ba4dd53f23495dcb04995e96f47c243217fc279f10795871b725cd009aen, message)
			return { r: signature.r, s: signature.s, yParity: signature.recoveryParameter === 0 ? 'even' : 'odd' }
		}
		this.rpc = new FetchJsonRpc(jsonRpcEndpoint, window.fetch.bind(window), async () => 10n**9n, async () => this.address, signer)
	}

	public readonly call = async (to: bigint, methodSignature: string, parameters: EncodableArray, value: bigint): Promise<Uint8Array> => {
		return await this.rpc.offChainContractCall({ to, data: await encodeMethod(keccak256.hash, methodSignature, parameters), value })
	}

	public readonly submitTransaction = async (to: bigint, methodSignature: string, parameters: EncodableArray, value: bigint): Promise<PartialTransactionReceipt> => {
		return await this.rpc.onChainContractCall({ to, data: await encodeMethod(keccak256.hash, methodSignature, parameters), value, ...getGasLimit(methodSignature) })
	}

	public readonly enable = async (): Promise<readonly bigint[]> => {
		this.enabled = true
		return [this.address]
	}

	public readonly noBrowserExtensionNeeded = () => true
}
