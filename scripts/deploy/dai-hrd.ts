import { deployContract } from './helpers'
import { JsonRpc } from '@zoltu/ethereum-types'
import { DaiHrd, Dependencies } from '../../generated/dai-hrd'

export async function deployDaiHrd(rpc: JsonRpc, dependencies: Dependencies) {
	const address = await deployContract(rpc, 'dai-hrd', 'DaiHrd.sol', 'DaiHrd', 0n)
	return new DaiHrd(dependencies, address)
}
