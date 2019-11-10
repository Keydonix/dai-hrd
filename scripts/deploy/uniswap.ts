import { JsonRpc } from '@zoltu/ethereum-types'
import { deployContract } from './helpers'
import { Factory, Dependencies } from '../../generated/uniswap'

export async function deployUniswap(rpc: JsonRpc, dependencies: Dependencies) {
	const exchangeAddress = await deployContract(rpc, 'uniswap', 'Uniswap.vy', 'Exchange')
	const factoryAddress = await deployContract(rpc, 'uniswap', 'Uniswap.vy', 'Factory')
	const factory = new Factory(dependencies, factoryAddress)
	await factory.initializeFactory(exchangeAddress)
	return factory
}
