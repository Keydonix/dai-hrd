const path = require('path')
const fs = require('fs').promises
const WorkflowCompile = require('@truffle/workflow-compile')

const ETH_TO_DEPOSIT = 10n
const DAI_TO_CREATE  = 80n
const FIXED_FEED_PRICE_IN_USD = 190n
const DAI_DEBT_CEILING = 1000n

const ETH_DECIMALS = 18n
const DAI_DECIMALS = 18n
const FIXED_FEED_PRICE_DECIMALS = 27n
const DAI_DEBT_CEILING_DECIMALS = 45n

const ETH_COLLATERAL_ID = web3.utils.asciiToHex('ETH-A')

const PIT_BURNER_ADDRESS = '0x0000000000000000000000000000000000000000'
const FAKE_PRICE_FEED_ADDRESS = '0x0000000000000000000000000000000000000000'
const MIN_SHUTDOWN_STAKE = 1

const DAI_SAVINGS_RATE = 10n**27n * 100001n / 100000n

function bigintToHexString(input) {
	return `0x${input.toString(16)}`
}

module.exports = async function (deployer, network, [account]) {
	const chainId = await getChainId()
	await deployer.deploy(artifacts.require('Migrations'))
	await deployErc1820(account)
	const mkrToken = await deployer.deploy(artifacts.require('DSToken'), web3.utils.asciiToHex('MKR'))
	const dssDeploy = await deployDssDeploy(deployer)
	await dssDeploy.deployVat()
	await dssDeploy.deployDai(chainId)
	await dssDeploy.deployTaxationAndAuctions(mkrToken.address)
	await dssDeploy.deployLiquidator()
	await dssDeploy.deployShutdown(mkrToken.address, PIT_BURNER_ADDRESS, MIN_SHUTDOWN_STAKE)
	const [daiAddress, vatAddress, potAddress, daiJoinAddress] = await Promise.all([
		dssDeploy.dai(),
		dssDeploy.vat(),
		dssDeploy.pot(),
		dssDeploy.daiJoin()
	])

	const potContract = await artifacts.require('Pot').at(potAddress)
	const vatContract = await artifacts.require('Vat').at(vatAddress)
	const daiContract = await artifacts.require('Dai').at(daiAddress)

	// Adding these currentl break tests and these 2 tx need to happen in same second, TODO: make a contract
	// await potContract.drip()
	// await potContract.methods['file(bytes32,uint256)'](web3.utils.asciiToHex('dsr'), bigintToHexString(DAI_SAVINGS_RATE))

	const ethJoin = await deployCollateral(deployer, dssDeploy, vatContract)

	await createVaultAndWithdrawDai(account, vatContract, ethJoin, daiJoinAddress, daiContract)

	// These functions unset the auth of the dssDeploy itself
	// await dssDeploy.releaseAuth
	// await dssDeploy.releaseAuthFlip

	const uniswapFactoryContract = await deployUniswapFactory(deployer)
	const daiHrdContract = await deployDaiHrd(
		deployer,
		daiAddress,
		vatAddress,
		potAddress,
		daiJoinAddress,
		uniswapFactoryContract)

	const contractAddresses = {
		vat: vatAddress,
		dai: daiAddress,
		ethJoin: ethJoin.address,
		dssDeploy: dssDeploy.address,
		daiHrd: daiHrdContract.address,
		account,
	}
	console.log(contractAddresses)
}

async function getChainId() {
	return new Promise((resolve, reject) => {
		web3.currentProvider.send({id: '1', jsonrpc: '2.0', method: 'eth_chainId', params: []}, (_, response) => {
			if (response.result.error) reject(new Error(response.result.error))
			else resolve(Number.parseInt(response.result))
		})
	})
}

async function deployErc1820(account) {
	// if ERC1820 is not yet deployed, then deploy it
	if (await web3.eth.getCode('0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24') === '0x') {
		console.log('deploying ERC1820')
		// send ETH to ERC1820 deployment address
		await web3.eth.sendTransaction({ from: account, to: '0xa990077c3205cbDf861e17Fa532eeB069cE9fF96', value: '0x11c37937e080000' })
		// deploy ERC1820
		await web3.eth.sendSignedTransaction('0xf90a388085174876e800830c35008080b909e5608060405234801561001057600080fd5b506109c5806100206000396000f3fe608060405234801561001057600080fd5b50600436106100a5576000357c010000000000000000000000000000000000000000000000000000000090048063a41e7d5111610078578063a41e7d51146101d4578063aabbb8ca1461020a578063b705676514610236578063f712f3e814610280576100a5565b806329965a1d146100aa5780633d584063146100e25780635df8122f1461012457806365ba36c114610152575b600080fd5b6100e0600480360360608110156100c057600080fd5b50600160a060020a038135811691602081013591604090910135166102b6565b005b610108600480360360208110156100f857600080fd5b5035600160a060020a0316610570565b60408051600160a060020a039092168252519081900360200190f35b6100e06004803603604081101561013a57600080fd5b50600160a060020a03813581169160200135166105bc565b6101c26004803603602081101561016857600080fd5b81019060208101813564010000000081111561018357600080fd5b82018360208201111561019557600080fd5b803590602001918460018302840111640100000000831117156101b757600080fd5b5090925090506106b3565b60408051918252519081900360200190f35b6100e0600480360360408110156101ea57600080fd5b508035600160a060020a03169060200135600160e060020a0319166106ee565b6101086004803603604081101561022057600080fd5b50600160a060020a038135169060200135610778565b61026c6004803603604081101561024c57600080fd5b508035600160a060020a03169060200135600160e060020a0319166107ef565b604080519115158252519081900360200190f35b61026c6004803603604081101561029657600080fd5b508035600160a060020a03169060200135600160e060020a0319166108aa565b6000600160a060020a038416156102cd57836102cf565b335b9050336102db82610570565b600160a060020a031614610339576040805160e560020a62461bcd02815260206004820152600f60248201527f4e6f7420746865206d616e616765720000000000000000000000000000000000604482015290519081900360640190fd5b6103428361092a565b15610397576040805160e560020a62461bcd02815260206004820152601a60248201527f4d757374206e6f7420626520616e204552433136352068617368000000000000604482015290519081900360640190fd5b600160a060020a038216158015906103b85750600160a060020a0382163314155b156104ff5760405160200180807f455243313832305f4143434550545f4d4147494300000000000000000000000081525060140190506040516020818303038152906040528051906020012082600160a060020a031663249cb3fa85846040518363ffffffff167c01000000000000000000000000000000000000000000000000000000000281526004018083815260200182600160a060020a0316600160a060020a031681526020019250505060206040518083038186803b15801561047e57600080fd5b505afa158015610492573d6000803e3d6000fd5b505050506040513d60208110156104a857600080fd5b5051146104ff576040805160e560020a62461bcd02815260206004820181905260248201527f446f6573206e6f7420696d706c656d656e742074686520696e74657266616365604482015290519081900360640190fd5b600160a060020a03818116600081815260208181526040808320888452909152808220805473ffffffffffffffffffffffffffffffffffffffff19169487169485179055518692917f93baa6efbd2244243bfee6ce4cfdd1d04fc4c0e9a786abd3a41313bd352db15391a450505050565b600160a060020a03818116600090815260016020526040812054909116151561059a5750806105b7565b50600160a060020a03808216600090815260016020526040902054165b919050565b336105c683610570565b600160a060020a031614610624576040805160e560020a62461bcd02815260206004820152600f60248201527f4e6f7420746865206d616e616765720000000000000000000000000000000000604482015290519081900360640190fd5b81600160a060020a031681600160a060020a0316146106435780610646565b60005b600160a060020a03838116600081815260016020526040808220805473ffffffffffffffffffffffffffffffffffffffff19169585169590951790945592519184169290917f605c2dbf762e5f7d60a546d42e7205dcb1b011ebc62a61736a57c9089d3a43509190a35050565b600082826040516020018083838082843780830192505050925050506040516020818303038152906040528051906020012090505b92915050565b6106f882826107ef565b610703576000610705565b815b600160a060020a03928316600081815260208181526040808320600160e060020a031996909616808452958252808320805473ffffffffffffffffffffffffffffffffffffffff19169590971694909417909555908152600284528181209281529190925220805460ff19166001179055565b600080600160a060020a038416156107905783610792565b335b905061079d8361092a565b156107c357826107ad82826108aa565b6107b85760006107ba565b815b925050506106e8565b600160a060020a0390811660009081526020818152604080832086845290915290205416905092915050565b6000808061081d857f01ffc9a70000000000000000000000000000000000000000000000000000000061094c565b909250905081158061082d575080155b1561083d576000925050506106e8565b61084f85600160e060020a031961094c565b909250905081158061086057508015155b15610870576000925050506106e8565b61087a858561094c565b909250905060018214801561088f5750806001145b1561089f576001925050506106e8565b506000949350505050565b600160a060020a0382166000908152600260209081526040808320600160e060020a03198516845290915281205460ff1615156108f2576108eb83836107ef565b90506106e8565b50600160a060020a03808316600081815260208181526040808320600160e060020a0319871684529091529020549091161492915050565b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff161590565b6040517f01ffc9a7000000000000000000000000000000000000000000000000000000008082526004820183905260009182919060208160248189617530fa90519096909550935050505056fea165627a7a72305820377f4a2d4301ede9949f163f319021a6e9c687c292a5e2b2c4734c126b524e6c00291ba01820182018201820182018201820182018201820182018201820182018201820a01820182018201820182018201820182018201820182018201820182018201820')
	}
}

async function deployDssDeploy(deployer) {
	const fabs = [
		'VatFab',
		'JugFab',
		'VowFab',
		'CatFab',
		'DaiFab',
		'DaiJoinFab',
		'FlapFab',
		'FlopFab',
		'FlipFab',
		'SpotFab',
		'PotFab',
		'EndFab',
		'ESMFab']
	const fabContracts = await Promise.all(fabs.map(fab => deployer.deploy(artifacts.require(fab))))
	return deployer.deploy(artifacts.require('DssDeploy'),
		...fabContracts.map(fab => fab.address)
	)
}

// Deploy the Ether-direct collateral (no wrapped ETH)
async function deployCollateral(deployer, dssDeploy, vatContract) {
	const ethJoin = await deployer.deploy(artifacts.require('ETHJoin'), vatContract.address, ETH_COLLATERAL_ID)
	await dssDeploy.deployCollateral(ETH_COLLATERAL_ID, ethJoin.address, FAKE_PRICE_FEED_ADDRESS)
	await vatContract.file(ETH_COLLATERAL_ID, web3.utils.asciiToHex("line"), decimalValueToHex(DAI_DEBT_CEILING, DAI_DEBT_CEILING_DECIMALS))
	await vatContract.file(web3.utils.asciiToHex("Line"), decimalValueToHex(DAI_DEBT_CEILING, DAI_DEBT_CEILING_DECIMALS))
	await vatContract.file(ETH_COLLATERAL_ID, web3.utils.asciiToHex("spot"), decimalValueToHex(FIXED_FEED_PRICE_IN_USD, FIXED_FEED_PRICE_DECIMALS))
	return ethJoin
}

async function createVaultAndWithdrawDai(account, vatContract, ethJoin, daiJoinAddress, daiContract) {
	const daiJoinContract = await artifacts.require('DaiJoin').at(daiJoinAddress)

	// Authorize the daiJoin to modify our vat dai balances
	await vatContract.hope(daiJoinAddress)

	// Deposit eth into vat
	await ethJoin.join(account, {value: decimalValueToHex(ETH_TO_DEPOSIT, ETH_DECIMALS)})

	console.log("\nBefore Depositing into Vault:")
	await printBalances(account, vatContract, daiContract)
	await vatContract.frob(ETH_COLLATERAL_ID, account, account, account, decimalValueToHex(ETH_TO_DEPOSIT, ETH_DECIMALS), decimalValueToHex(DAI_TO_CREATE, DAI_DECIMALS))

	console.log("\nAfter Depositing into Vault:")
	await printBalances(account, vatContract, daiContract)

	await daiJoinContract.exit(account, decimalValueToHex(DAI_TO_CREATE, DAI_DECIMALS) )

	console.log("\nAfter Withdrawing DAI Into ERC20:")
	await printBalances(account, vatContract, daiContract)
}


async function deployUniswapFactory(deployer) {
	const uniswapExchangeTemplate = await deployer.deploy(artifacts.require('UniswapExchangeTemplate'))
	const uniswapFactory = await deployer.deploy(artifacts.require('UniswapFactory'))
	await uniswapFactory.initializeFactory(uniswapExchangeTemplate.address)
	return uniswapFactory
}

async function deployDaiHrd(deployer, dai, vat, pot, daiJoin, uniswapFactory) {
	const uniswapExchangeAddress = await uniswapFactory.createExchange.call('0xadd12e55add12e55add12e55add12e55add12e55')

	const runtimeConstantsSource = `// THIS FILE IS AUTOGENERATED DURING MIGRATION, DO NOT EDIT BY HAND
pragma solidity 0.5.12;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { DaiJoin } from "./join.sol";
import { Pot } from "./pot.sol";
import { Vat } from "./vat.sol";

contract RuntimeConstants {
	IERC20 constant public dai = IERC20(${dai});
	Pot constant public pot = Pot(${pot});
	DaiJoin constant public daiJoin = DaiJoin(${daiJoin});
	Vat constant public vat = Vat(${vat});
	address constant public uniswapExchange = ${uniswapExchangeAddress.toString(16).padStart(40, '0')};
}
`
	await fs.writeFile(path.join(__dirname, '..', 'contracts', 'RuntimeConstants.sol'), runtimeConstantsSource)

	// recompile DaiHrd.sol (easiest to just re-compile everything)
	await WorkflowCompile.compile(config)
	const DaiHrd = artifacts.require('DaiHrd')
	const daiHrd = await deployer.deploy(DaiHrd)
	await uniswapFactory.createExchange(daiHrd.address)
	if (await daiHrd.uniswapExchange() !== await uniswapFactory.getExchange(daiHrd.address)) throw new Error(`daiHrd.uniswapExchange() (${await daiHrd.uniswapExchange()}) !== uniswapFactory.getExchange(daiHrd) (${await uniswapFactory.getExchange(daiHrd.address)})`)
	return daiHrd
}

async function printBalances(account, vatContract, daiContract) {
	console.log(`\nVAT ETH   : ${await vatContract.gem(ETH_COLLATERAL_ID, account)}
VAT DAI   : ${await vatContract.dai(account)}
DAI ERC20 : ${await daiContract.balanceOf(account)}\n`)
}

// Needs to handle signed values when we get there
function decimalValueToHex(value, decimals) {
	return '0x' + (value * (10n ** decimals)).toString(16)
}
