import { JsonRpc } from '@zoltu/ethereum-types'
import { DssDeploy, DSToken, Vat, Dai, Pot, DaiJoin, ETHJoin, Dependencies } from '../../generated/maker'
import { deployContract } from './helpers'
import { stringLiteralToBigint, xToAttorontox, xToRontox, ethToAttoeth, daiToAttodai } from '../libraries/type-helpers'

const PIT_BURNER_ADDRESS = 0n
const FAKE_PRICE_FEED_ADDRESS = 0n
const MIN_SHUTDOWN_STAKE = 1n
const ETH_COLLATERAL_ID = stringLiteralToBigint('ETH-A')
const ETH_TO_DEPOSIT = 10n
const DAI_TO_CREATE  = 80n
const FIXED_FEED_PRICE_IN_USD = 190n
const DAI_DEBT_CEILING = 1000n

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

	// deploy collateral
	const ethJoin = new ETHJoin(dependencies, await deploy('join.sol', 'ETHJoin', vat.address, ETH_COLLATERAL_ID))
	await dssDeploy.deployCollateral(ETH_COLLATERAL_ID, ethJoin.address, FAKE_PRICE_FEED_ADDRESS)
	await vat.file(ETH_COLLATERAL_ID, stringLiteralToBigint('line'), xToAttorontox(DAI_DEBT_CEILING))
	await vat.file2(stringLiteralToBigint('Line'), xToAttorontox(DAI_DEBT_CEILING))
	await vat.file(ETH_COLLATERAL_ID, stringLiteralToBigint('spot'), xToRontox(FIXED_FEED_PRICE_IN_USD))

	return { dai, vat, pot, daiJoin, ethJoin }
}

export async function seedMaker(account: bigint, vat: Vat, daiJoin: DaiJoin, ethJoin: ETHJoin) {
	// Authorize the daiJoin to modify our vat dai balances
	await vat.hope(daiJoin.address)

	// Deposit eth into vat
	const attoethToDeposit = ethToAttoeth(ETH_TO_DEPOSIT)
	await ethJoin.join(account, attoethToDeposit)

	await vat.frob(ETH_COLLATERAL_ID, account, account, account, ethToAttoeth(ETH_TO_DEPOSIT), daiToAttodai(DAI_TO_CREATE))
	await daiJoin.exit(account, daiToAttodai(DAI_TO_CREATE))
}
