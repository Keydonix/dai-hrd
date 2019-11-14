import { promises as fs } from 'fs'
import { buildCacheDirectory } from '../libraries/paths'

export async function cleanCompile() {
	console.log('Removing build-cache directory...')
	await fs.rmdir(buildCacheDirectory, { recursive: true })
}

if (require.main === module) {
	cleanCompile().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
