import * as path from 'path'

export const contractsDirectory = path.join(__dirname, '..', '..', 'contracts')
export const nodeModulesDirectory = path.join(__dirname, '..', '..', 'node_modules')
export const buildCacheDirectory = path.join(__dirname, '..', '..', 'build-cache')
export const generatedTypeScriptDirectory = path.join(__dirname, '..', '..', 'generated')
export const testDbDirectory = path.join(__dirname, '..', '..', 'test', 'db')
export const lastDeployAddressPath = path.join(__dirname, '..', 'deploy', 'addresses.json')
