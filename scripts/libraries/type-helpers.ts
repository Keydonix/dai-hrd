import { Bytes } from '@zoltu/ethereum-types'

export function stringLiteralToBigint(literal: string): bigint {
	if (literal.length >= 32) throw new Error(`Cannot encode a string literal of length ${literal.length} into a bigint (bytes32).  ${literal}`)
	const literalBytes = new TextEncoder().encode(literal)
	return Bytes.fromByteArray([...literalBytes, ...new Uint8Array(32 - literalBytes.length)]).toUnsignedBigint()
}

export function bigintAttoToDecimalString(value: bigint): string {
	const integerPart = value / 10n**18n
	const fractionalPart = value % 10n**18n
	if (fractionalPart === 0n) {
		return integerPart.toString(10)
	} else {
		return `${integerPart.toString(10)}.${fractionalPart.toString(10).padStart(18, '0')}`
	}
}

export function bigintRontoToDecimalString(value: bigint): string {
	const integerPart = value / 10n**27n
	const fractionalPart = value % 10n**27n
	if (fractionalPart === 0n) {
		return integerPart.toString(10)
	} else {
		return `${integerPart.toString(10)}.${fractionalPart.toString(10).padStart(27, '0')}`
	}
}

export function bigintAttorontoToDecimalString(value: bigint): string {
	const integerPart = value / 10n**45n
	const fractionalPart = value % 10n**45n
	if (fractionalPart === 0n) {
		return integerPart.toString(10)
	} else {
		return `${integerPart.toString(10)}.${fractionalPart.toString(10).padStart(45, '0')}`
	}
}

export const attoethToEth = (attoeth: bigint) => Number(attoeth) / 10**18
export const ethToAttoeth = (eth: number | bigint) => typeof eth === 'bigint' ? eth * 10n**18n : BigInt(eth * 10**18)
export const attodaiToDai = (attodai: bigint) => attoethToEth(attodai)
export const daiToAttodai = (dai: number | bigint) => ethToAttoeth(dai)
export const rontoxToX = (x: bigint) => Number(x) / 10**27
export const xToRontox = (x: number | bigint) => typeof x === 'bigint' ? x * 10n**27n : BigInt(x * 10**27)
export const attorontoxToX = (x: bigint) => Number(x) / 10**45
export const xToAttorontox = (x: number | bigint) => typeof x === 'bigint' ? x * 10n**45n : BigInt(x * 10**45)
