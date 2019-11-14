import { JsonRpc } from '@zoltu/ethereum-types'
import { DssDeploy, DSToken, Vat, Dai, Pot, DaiJoin, ETHJoin, SetDsr, Dependencies } from '../../generated/maker'
import { deployContract } from './helpers'
import { stringLiteralToBigint } from '../libraries/type-helpers'

const PIT_BURNER_ADDRESS = 0n
const FAKE_PRICE_FEED_ADDRESS = 0n
const MIN_SHUTDOWN_STAKE = 1n
const ETH_COLLATERAL_ID = stringLiteralToBigint('ETH-A')

export async function deployMaker(rpc: JsonRpc, dependencies: Dependencies) {
	// simplify deployment calls
	const deploy = deployContract.bind(undefined, rpc, 'maker')

	// deploy MKR
	const mkr = new DSToken(dependencies, await deploy('ds-token/token.sol', 'DSToken', stringLiteralToBigint('MKR')))

	// deploy the deployers
	// NOTE: order matters here as this is the DssDeploy constructor parameter order
	const fabs = [ 'VatFab', 'JugFab', 'VowFab', 'CatFab', 'DaiFab', 'DaiJoinFab', 'FlapFab', 'FlopFab', 'FlipFab', 'SpotFab', 'PotFab', 'EndFab', 'ESMFab' ] as const
	const fabAddresses = []
	for (const fab of fabs) {
		const address = await deploy('DssDeploy.sol', fab)
		fabAddresses.push(address)
	}

	// deploy the deployers executor
	const dssDeploy = new DssDeploy(dependencies, await deploy('DssDeploy.sol', 'DssDeploy', ...fabAddresses))

	// execute the deploys
	await dssDeploy.deployVat()
	await dssDeploy.deployDai(await rpc.getChainId())
	await dssDeploy.deployTaxationAndAuctions(mkr.address)
	await dssDeploy.deployLiquidator()
	await dssDeploy.deployShutdown(mkr.address, PIT_BURNER_ADDRESS, MIN_SHUTDOWN_STAKE)

	// read deployed addresses for things we care about
	const dai = new Dai(dependencies, await dssDeploy.dai_())
	const vat = new Vat(dependencies, await dssDeploy.vat_())
	const pot = new Pot(dependencies, await dssDeploy.pot_())
	const daiJoin = new DaiJoin(dependencies, await dssDeploy.daiJoin_())

	const setDsr = new SetDsr(dependencies, await deploy('SetDsr.sol', 'SetDsr', pot.address))
	await pot.rely(setDsr.address)

	// deploy collateral
	const ethJoin = new ETHJoin(dependencies, await deploy('join.sol', 'ETHJoin', vat.address, ETH_COLLATERAL_ID))
	await dssDeploy.deployCollateral(ETH_COLLATERAL_ID, ethJoin.address, FAKE_PRICE_FEED_ADDRESS)

	return { dai, vat, pot, daiJoin, ethJoin, setDsr }
}
