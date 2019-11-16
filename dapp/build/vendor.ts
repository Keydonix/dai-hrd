import * as path from 'path'
import { promises as fs } from 'fs'
import { recursiveDirectoryCopy } from '@zoltu/file-copier'

async function vendorDependencies() {
	const dependencyPaths = [
		[ '@keydonix/dai-hrd', 'output-es', 'dai-hrd.js' ],
		[ '@zoltu/ethereum-abi-encoder', 'output-es', 'index.js' ],
		[ '@zoltu/ethereum-crypto', 'output-es', 'index.js' ],
		[ '@zoltu/ethereum-fetch-json-rpc', 'output-es', 'index.js' ],
		[ '@zoltu/ethereum-types', 'output-es', 'index.js' ],
		[ 'es-module-shims', 'dist', 'es-module-shims.min.js' ],
		[ 'react', 'umd', 'react.production.min.js' ],
		[ 'react-dom', 'umd', 'react-dom.production.min.js' ],
	]

	for (const [name, subfolder] of dependencyPaths) {
		const sourceDirectoryPath = path.join(__dirname, '..', 'node_modules', name, subfolder)
		const destinationDirectoryPath = path.join(__dirname, '..', 'app', 'vendor', name)
		await recursiveDirectoryCopy(sourceDirectoryPath, destinationDirectoryPath)
	}

	const indexHtmlPath = path.join(__dirname, '..', 'app', 'index.html')
	const oldIndexHtml = await fs.readFile(indexHtmlPath, 'utf8')
	const importmap = dependencyPaths.reduce((importmap, [name, , file]) => {
		importmap.imports[name] = `./${path.join('.', 'vendor', name, file).replace(/\\/g, '/')}`
		return importmap
	}, { imports: {} as Record<string, string> })
	const importmapJson = JSON.stringify(importmap, undefined, '\t')
		.replace(/^/mg, '\t\t')
	const newIndexHtml = oldIndexHtml.replace(/<script type='importmap-shim'>[\s\S]*?<\/script>/m, `<script type='importmap-shim'>\n${importmapJson}\n\t</script>`)
	await fs.writeFile(indexHtmlPath, newIndexHtml)
}

if (require.main === module) {
	vendorDependencies().catch(error => {
		console.error(error.message)
		console.error(error)
		process.exit(1)
	})
}
