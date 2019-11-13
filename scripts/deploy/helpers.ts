import { JsonRpc, Bytes, TransactionReceipt } from '@zoltu/ethereum-types'
import { CompilerOutput } from 'solc'
import { encodeMethod as encodeMethod_, EncodableArray, FunctionDescription, encodeParameters, ParameterDescription } from '@zoltu/ethereum-abi-encoder'
import { keccak256 } from '@zoltu/ethereum-crypto'
import { readBuildCache } from '../compile/helpers'

// simplify this call throughout this script by baking in the hashing function
async function encodeMethod(functionDescription: FunctionDescription, ...parameters: EncodableArray): Promise<Uint8Array>
async function encodeMethod(functionSignature: string, ...parameters: EncodableArray): Promise<Uint8Array>
async function encodeMethod(first: FunctionDescription | string, ...parameters: EncodableArray): Promise<Uint8Array> {
	if (typeof first === 'string') return encodeMethod_(keccak256.hash, first, parameters)
	else return encodeMethod_(keccak256.hash, first, parameters)
}

type OnChainMethod = (methodName: string, ...parameters: EncodableArray) => Promise<TransactionReceipt>
type OffChainMethod = (methodName: string, ...parameters: EncodableArray) => Promise<Bytes>
type MethodOptions = {
	readonly value?: bigint
	readonly gasLimit?: bigint
	readonly gasPrice?: bigint
	readonly nonce?: bigint
}
export interface ContractInterface {
	address: bigint
	onChain: {
		(methodName: string, ...parameters: EncodableArray): Promise<TransactionReceipt>,
		options: (options: MethodOptions) => OnChainMethod,
	},
	offChain: {
		(methodName: string, ...parameters: EncodableArray): Promise<Bytes>,
		options: (options: MethodOptions) => OffChainMethod,
	},
}

export function getContractInterface(rpc: JsonRpc, compilerOutput: Readonly<CompilerOutput>, contractFileName: string, contractName: string, contractAddress: bigint): ContractInterface {
	async function encode(methodName: string, parameters: EncodableArray) {
		const abi = compilerOutput['contracts'][contractFileName][contractName].abi
		// FIXME: function overloads with the same number of parameters but different types will match incorrectly, fix if any contracts we use do that
		const methodAbi = abi.find(x => x.name === methodName && x.inputs.length === parameters.length)
		if (methodAbi === undefined) throw new Error(`Method ${methodName} with ${parameters.length} parameters not found in ${contractName} ABI.`)
		return await encodeMethod(methodAbi as FunctionDescription, ...parameters)
	}

	const constructOnChainFunction = (options: MethodOptions) => {
		return async (methodName: string, ...parameters: EncodableArray) => await rpc.onChainContractCall({
			to: contractAddress,
			data: await encode(methodName, parameters),
			...options.value !== undefined ? { value: options.value } : {},
			...options.gasLimit !== undefined ? { gasLimit: options.gasLimit } : {},
			...options.gasPrice !== undefined ? { gasPrice: options.gasPrice } : {},
			...options.nonce !== undefined ? { nonce: options.nonce } : {},
		})
	}

	const constructOffChainFunction = (options: MethodOptions) => {
		return async (methodName: string, ...parameters: EncodableArray) => await rpc.offChainContractCall({
			to: contractAddress,
			data: await encode(methodName, parameters),
			...options.value !== undefined ? { value: options.value } : {},
			...options.gasLimit !== undefined ? { gasLimit: options.gasLimit } : {},
			...options.gasPrice !== undefined ? { gasPrice: options.gasPrice } : {},
			...options.nonce !== undefined ? { nonce: options.nonce } : {},
		})
	}

	return {
		address: contractAddress,
		onChain: Object.assign(
			constructOnChainFunction({}),
			{ options: (options: MethodOptions) => constructOnChainFunction(options) }
		),
		offChain: Object.assign(
			constructOffChainFunction({}),
			{ options: (options: MethodOptions) => constructOffChainFunction(options) }
		),
	}
}

export async function deployContract(rpc: JsonRpc, cacheName: string, fileName: string, contractName: string, ...parameters: EncodableArray): Promise<bigint> {
	const { compilerOutput } = await readBuildCache(cacheName)
	const compilerOutputContract = compilerOutput['contracts'][fileName][contractName]
	const constructorInputs: readonly ParameterDescription[] = (compilerOutputContract.abi.find(x => x.type === 'constructor') || {}).inputs || []
	const bytecode = Bytes.fromHexString(compilerOutputContract.evm.bytecode.object)
	const encodedConstructorParameters = encodeParameters(constructorInputs, parameters)
	const constructorBytecode = Bytes.fromByteArray([...bytecode, ...encodedConstructorParameters])
	return await rpc.deployContract(constructorBytecode)
}

export function stringLiteralToBigint(literal: string): bigint {
	if (literal.length >= 32) throw new Error(`Cannot encode a string literal of length ${literal.length} into a bigint (bytes32).  ${literal}`)
	const literalBytes = new TextEncoder().encode(literal)
	return Bytes.fromByteArray([...literalBytes, ...new Uint8Array(32 - literalBytes.length)]).toUnsignedBigint()
}

export const attoethToEth = (attoeth: bigint) => Number(attoeth) / 10**18
export const ethToAttoeth = (eth: number | bigint) => typeof eth === 'bigint' ? eth * 10n**18n : BigInt(eth * 10**18)
export const attodaiToDai = (attodai: bigint) => attoethToEth(attodai)
export const daiToAttodai = (dai: number | bigint) => ethToAttoeth(dai)
export const rontoxToX = (x: bigint) => Number(x) / 10**27
export const xToRontox = (x: number | bigint) => typeof x === 'bigint' ? x * 10n**27n : BigInt(x * 10**27)
export const attorontoxToX = (x: bigint) => Number(x) / 10**45
export const xToAttorontox = (x: number | bigint) => typeof x === 'bigint' ? x * 10n**45n : BigInt(x * 10**45)

// https://github.com/microsoft/TypeScript/issues/31535
interface TextEncoder {
	/** Returns "utf-8". */
	readonly encoding: string
	/** Returns the result of running UTF-8's encoder. */
	encode(input?: string): Uint8Array
}
declare var TextEncoder: { prototype: TextEncoder; new(): TextEncoder }
