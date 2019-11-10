import { promises as fs } from 'fs'
import { buildCacheDirectory, generatedTypeScriptDirectory, testDbDirectory } from './libraries/paths'

export async function clean() {
	console.log('Removing build-cache directory...')
	await fs.rmdir(buildCacheDirectory, { recursive: true })
	console.log('Removing generated directory...')
	await fs.rmdir(generatedTypeScriptDirectory, { recursive: true })
	console.log('Removing test DB directory...')
	await fs.rmdir(testDbDirectory, { recursive: true })
}

if (require.main === module) {
	clean().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
