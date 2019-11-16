import { Dependencies } from '@keydonix/dai-hrd'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { encodeMethod, EncodableArray } from '@zoltu/ethereum-abi-encoder'
import { keccak256 } from '@zoltu/ethereum-crypto'

export class ReadonlyFetchJsonRpcDependencies implements Dependencies {
	private readonly rpc: FetchJsonRpc

	public constructor(jsonRpcEndpoint: string) {
		this.rpc = new FetchJsonRpc(jsonRpcEndpoint, window.fetch.bind(window), async () => 10n**9n)
	}

	public readonly call = async (to: bigint, methodSignature: string, parameters: EncodableArray, value: bigint): Promise<Uint8Array> => {
		return await this.rpc.offChainContractCall({ to, data: await encodeMethod(keccak256.hash, methodSignature, parameters), value })
	}

	public readonly submitTransaction = async () => {
		throw new Error(`Transaction signing not supported.  Consider using MetaMask instead.`)
	}
}
