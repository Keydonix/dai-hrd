export function bigintEthToDecimalString(value: bigint): string {
	const integerPart = value / 10n**18n
	const fractionalPart = value % 10n**18n
	if (fractionalPart === 0n) {
		return integerPart.toString(10)
	} else {
		return `${integerPart.toString(10)}.${fractionalPart.toString(10).padStart(18, '0')}`
	}
}

export function bigintDaiToDecimalString(value: bigint): string {
	return bigintEthToDecimalString(value)
}

export function decimalStringToBigintEth(valueString: string): bigint | undefined {
	if (!/^\d+(?:\.\d+)?$/.test(valueString)) return undefined
	const splitValueString = valueString.split('.')
	const integerPartString = splitValueString[0] + '000000000000000000'
	const fractionalPartString = ((splitValueString.length === 2) ? splitValueString[1] : '0').slice(0, 18).padEnd(18, '0')
	return BigInt(integerPartString) + BigInt(fractionalPartString)
}

export function decimalStringToBigintDai(value: string): bigint | undefined {
	return decimalStringToBigintEth(value)
}
