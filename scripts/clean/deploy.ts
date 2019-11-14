import { promises as fs } from 'fs'
import { testDbDirectory, lastDeployAddressPath } from '../libraries/paths'
import { fileExists } from '../libraries/filesystem-extensions'

export async function cleanDeploy() {
	if (await fileExists(lastDeployAddressPath)) {
		console.log('Removing addresses...')
		await fs.unlink(lastDeployAddressPath)
	}

	if (await fileExists(testDbDirectory)) {
		console.log('Removing test DB directory...')
		await fs.rmdir(testDbDirectory, { recursive: true })
	}
}

if (require.main === module) {
	cleanDeploy().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
