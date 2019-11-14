import { promises as fs } from 'fs'
import { generatedTypeScriptDirectory } from '../libraries/paths'

export async function cleanGenerated() {
	console.log('Removing generated directory...')
	await fs.rmdir(generatedTypeScriptDirectory, { recursive: true })
}

if (require.main === module) {
	cleanGenerated().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
