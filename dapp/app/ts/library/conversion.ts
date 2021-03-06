export function bigintEthToDecimalString(value: bigint, fractionalDigits: number = 18): string {
	const integerPart = value / 10n**18n
	const fractionalPart = value % 10n**18n
	if (fractionalPart === 0n) {
		return integerPart.toString(10)
	} else {
		return `${integerPart.toString(10)}.${fractionalPart.toString(10).padStart(18, '0').slice(0, fractionalDigits)}`
	}
}

export function bigintDaiToDecimalString(value: bigint, fractionalDigits: number = 18): string {
	return bigintEthToDecimalString(value, fractionalDigits)
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

export function daiHrdToDai(attodaiHrd: bigint, attodaiPerDaiHrd: bigint, rontodsr: bigint, startTimeSeconds: number): number {
	const nowSeconds = Date.now() / 1000
	const elapsed = nowSeconds - startTimeSeconds
	return (Number(rontodsr) / 10**27) ** elapsed * Number(attodaiHrd) / 10**18 * Number(attodaiPerDaiHrd) / 10**18
}

export function tryHexStringAddressToBigint(hex: string): bigint | undefined {
	const match = /^(?:0x)?([a-fA-F0-9]{40})$/.exec(hex)
	if (match === null) return undefined
	return BigInt(`0x${match[1]}`)
}
