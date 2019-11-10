declare module 'ethereum' {
	export type Primitive = 'uint8' | 'uint64' | 'uint256' | 'bool' | 'string' | 'address' | 'bytes4' | 'bytes20' | 'bytes32' | 'bytes' | 'int256' | 'tuple' | 'address[]' | 'uint256[]' | 'bytes32[]' | 'tuple[]';

	export interface AbiParameter {
		name: string,
		type: Primitive,
		components?: ReadonlyArray<AbiParameter>
	}

	export interface AbiEventParameter extends AbiParameter {
		indexed: boolean,
	}

	export interface AbiFunction {
		name: string,
		type: 'function' | 'constructor' | 'fallback',
		stateMutability?: 'pure' | 'view' | 'payable' | 'nonpayable',
		constant: boolean,
		payable: boolean,
		inputs: ReadonlyArray<AbiParameter>,
		outputs: ReadonlyArray<AbiParameter>,
	}

	export interface AbiEvent {
		name: string,
		type: 'event',
		inputs: ReadonlyArray<AbiEventParameter>,
		anonymous: boolean,
	}

	export type Abi = ReadonlyArray<AbiFunction | AbiEvent>;
}
