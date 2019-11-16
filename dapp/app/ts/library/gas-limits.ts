const explicitGasPrices: Record<string, bigint> = {
	'deposit(uint256)': 300000n,
	'withdrawVatDai(address,uint256)': 200000n,
	'withdrawToDenominatedInDai(address,uint256)': 300000n,
	'withdrawTo(address,uint256)': 300000n,
	'setDsr(uint256)': 300000n,
}

export function getGasLimit(methodSignature: string): {gasLimit?: bigint} {
	if (methodSignature in explicitGasPrices) {
		return { gasLimit: explicitGasPrices[methodSignature] }
	} else {
		return {}
	}
}
