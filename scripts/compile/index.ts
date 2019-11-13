import { Crypto } from '@peculiar/webcrypto'
import { compileUniswap } from './uniswap'
import { compileMaker } from './maker'
import { compileDaiHrd } from './dai-hrd'
import { compileErc1820 } from './erc1820'

// necessary so node crypto looks like web crypto, which @zoltu/ethereum-crypto needs
globalThis.crypto = new Crypto()

const placeholderAddress = 0xadd12e55add12e55add12e55add12e55add12e55n

export async function compile() {
	console.log('Compiling ERC1820...')
	await compileErc1820()
	console.log('Compiling Uniswap...')
	await compileUniswap()
	console.log('Compiling Maker...')
	await compileMaker()
	console.log('Compiling DaiHrd...')
	// we do an initial compile so we can generate the TypeScript interfaces file and build-cache files which are referenced by the deploy
	await compileDaiHrd(placeholderAddress, placeholderAddress, placeholderAddress, placeholderAddress, async () => placeholderAddress)
}

if (require.main === module) {
	compile().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
