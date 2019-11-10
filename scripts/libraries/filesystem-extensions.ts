import * as fsCallback from 'fs'
import { promises as fs } from 'fs'

export async function fileExists(path: string) {
	// we use `fsCallback` instead of `fs` here so we don't have a caught exception for a non-exceptional codepath
	return new Promise(resolve => {
		fsCallback.access(path, (error: Error | null) => {
			if (error === null) resolve(true)
			else resolve(false)
		})
	})
}

export async function ensureDirectoryExists(path: string) {
	if (await fileExists(path)) return
	await fs.mkdir(path)
}

export async function getFileTouchTime(path: string) {
	const fileStats = await fs.stat(path)
	return fileStats.mtimeMs
}

export async function getMostRecentFileTouchTime(paths: readonly string[]) {
	let latest = 0
	for (const path of paths) {
		const touchTime = await getFileTouchTime(path)
		latest = Math.max(latest, touchTime)
	}
	return latest
}
