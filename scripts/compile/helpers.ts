import * as path from 'path'
import { promises as fs } from 'fs'
import { CompilerInput, compileStandardWrapper, CompilerOutputError, CompilerOutput } from 'solc'
import { generateContractInterfaces } from '@zoltu/solidity-typescript-generator'
import { fileExists, ensureDirectoryExists } from '../libraries/filesystem-extensions'
import { contractsDirectory, buildCacheDirectory, generatedTypeScriptDirectory, nodeModulesDirectory } from '../libraries/paths'

export async function getVendoredSource(relativePath: string) {
	const filePath = path.normalize(path.join(contractsDirectory, relativePath))
	return await fs.readFile(filePath, 'utf8')
}

export async function compile(cacheName: string, filenamesOrSources: readonly (string | [ string, string ])[]) {
	let sources: Record<string, { content: string }> = {}
	for (const filenameOrSource of filenamesOrSources) {
		if (typeof filenameOrSource === 'string') {
			const absolutePath = await resolveRelativeContractPath(filenameOrSource)
			const content = await fs.readFile(absolutePath, 'utf8')
			sources[filenameOrSource] = { content }
		} else {
			sources[filenameOrSource[0]] = { content: filenameOrSource[1] }
		}
	}
	const compilerInput: CompilerInput = {
		language: 'Solidity',
		settings: {
			optimizer: { enabled: true, runs: 200 },
			outputSelection: { '*': { '*': [ 'abi', 'metadata', 'evm.bytecode.object', 'evm.bytecode.sourceMap', 'evm.deployedBytecode.object', 'evm.methodIdentifiers', 'evm.gasEstimates' ] } }
		},
		sources
	}
	const compilerInputJson = JSON.stringify(compilerInput)

	// avoid recompiling if we have a cache that is newer than all of the contracts we would be compiling
	const buildCachePath = getBuildCachePath(cacheName)
	if (await fileExists(buildCachePath)) {
		const buildCacheJson = await fs.readFile(buildCachePath, 'utf8')
		const buildCache = JSON.parse(buildCacheJson) as { compileTime: number, compilerInput: CompilerInput, compilerOutput: CompilerOutput }
		if (JSON.stringify(buildCache.compilerInput) === compilerInputJson) {
			console.log('... using cache')
			return buildCache.compilerOutput
		}
	}

	const compilerOutputJson = compileStandardWrapper(compilerInputJson)
	const compilerOutput = JSON.parse(compilerOutputJson) as CompilerOutput
	const errors = compilerOutput.errors
	if (errors && errors.some(isNotMakerWarning)) {
		let concatenatedErrors = "";

		for (let error of errors.filter(isNotMakerWarning)) {
			concatenatedErrors += error.formattedMessage + "\n";
		}

		if (concatenatedErrors.length > 0) {
			throw new Error("The following errors/warnings were returned by solc:\n\n" + concatenatedErrors);
		}
	}

	await writeBuildCache(cacheName, compilerInput, compilerOutput)
	await writeGeneratedTypeScript(cacheName, compilerOutput)

	return compilerOutput
}

export async function writeBuildCache(cacheName: string, compilerInput: CompilerInput, compilerOutput: CompilerOutput) {
	await ensureDirectoryExists(buildCacheDirectory)
	const path = getBuildCachePath(cacheName)
	const contents: BuildCacheFile = { compileTime: Date.now(), compilerInput, compilerOutput }
	const contentsJson = JSON.stringify(contents, null, '\t')
	await fs.writeFile(path, contentsJson)
}

export async function writeGeneratedTypeScript(cacheName: string, compilerOutput: CompilerOutput) {
	await ensureDirectoryExists(generatedTypeScriptDirectory)
	const generateTypes = await generateContractInterfaces(compilerOutput)
	await fs.writeFile(getGeneratedPath(cacheName), generateTypes)
}

export async function readBuildCache(cacheName: string): Promise<BuildCacheFile> {
	const path = getBuildCachePath(cacheName)
	const json = await fs.readFile(path, 'utf8')
	return JSON.parse(json) as BuildCacheFile
}

function getBuildCachePath(cacheName: string) {
	return path.join(buildCacheDirectory, `${cacheName}.json`)
}

function getGeneratedPath(cacheName: string) {
	return path.join(generatedTypeScriptDirectory, `${cacheName}.ts`)
}

function isNotMakerWarning(error: CompilerOutputError): boolean {
	if (error.message !== 'Variable is shadowed in inline assembly by an instruction of the same name') return true
	if (error.sourceLocation && error.sourceLocation.file === 'vat.sol') return false
	if (error.sourceLocation && error.sourceLocation.file === 'pot.sol') return false
	if (error.sourceLocation && error.sourceLocation.file === 'jug.sol') return false
	return true
}

async function resolveRelativeContractPath(relativePath: string) {
	const localPath = path.join(contractsDirectory, relativePath)
	const nodeModulesPath = path.join(nodeModulesDirectory, relativePath)
	if (await fileExists(localPath)) return localPath
	if (await fileExists(nodeModulesPath)) return nodeModulesPath
	throw new Error(`Could not locate ${relativePath} in either local contracts directory or node_modules.`)
}

interface BuildCacheFile {
	compileTime: number
	compilerInput: CompilerInput
	compilerOutput: CompilerOutput
}
