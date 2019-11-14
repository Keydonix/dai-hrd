import { cleanCompile } from './compile'
import { cleanGenerated } from './generated'
import { cleanDeploy } from './deploy'

export async function cleanAll() {
	await cleanCompile()
	await cleanGenerated()
	await cleanDeploy()
}

if (require.main === module) {
	cleanAll().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
