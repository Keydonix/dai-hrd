import fetch from 'node-fetch'
import * as ganache from 'ganache-core'
import { Crypto } from '@peculiar/webcrypto'
import { ensureDirectoryExists } from './filesystem-extensions'
import { testDbDirectory } from './paths'
import { MnemonicSigner } from './mnemonic-signer'
import { PrivateKeySigner } from './privatekey-signer'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { bigintAttoToDecimalString } from './type-helpers'

const disabledLogger: {log:(message:string) => void} = {log:()=>{}}

export async function startGanache(consoleLogging: boolean = false, port: number | undefined = undefined): Promise<number> {
	// start ganache server in-memory
	const gasLimit = 9600000
	let logger = consoleLogging ? console : disabledLogger
	// TODO: redeploy if any file in build-cache is newer than addresses.json
	// await fs.rmdir(dbPath, { recursive: true })
	await ensureDirectoryExists(testDbDirectory)
	const signers = await Promise.all([ await PrivateKeySigner.createTest(), ...[...Array(10).keys()].map(i => MnemonicSigner.createTest(i)) ])
	const server = ganache.server({
		gasLimit,
		logger: { log: (message: string) => logger.log(message) },
		db_path: testDbDirectory,
		// db: MemDown(),
		accounts: signers.map(signer => ({ balance: 100_000 * 10**18, secretKey: `0x${signer.privateKey.toString(16).padStart(40,'0')}` }))
	})

	await new Promise((resolve, reject) => {
		server.listen(port || 0, (error: Error, stateManager: unknown) => {
			if (error) reject(error)
			else resolve(stateManager)
		})
	})

	const actualPort = server.address().port
	console.log(`Listening on port ${actualPort}`)
	console.log(`http://localhost:${actualPort}`)

	// disable logging while we print balances so we don't see all of the `eth_call`s
	logger = disabledLogger
	const rpc = new FetchJsonRpc(`http://localhost:${actualPort}`, fetch, async () => 10n**9n)
	console.log(`Address                                   Balance`)
	for (const signer of signers) {
		console.log(`${signer.address.toString(16).padStart(40,'0')}: ${bigintAttoToDecimalString(await rpc.getBalance(signer.address))}`)
	}
	// re-enable logging if configured to be on
	logger = consoleLogging ? console : {log: () => {}}

	return actualPort
}

if (require.main === module) {
	// necessary so node crypto looks like web crypto, which @zoltu/ethereum-crypto needs
	globalThis.crypto = new Crypto()

	startGanache(true, 8545).catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
