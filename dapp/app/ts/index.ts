import { createOnChangeProxy } from './library/proxy'
import { App, AppModel } from './components/App'
import { ContractConnections as Contracts } from './library/contracts'
import { ErrorHandler } from './library/error-handler'
import { EthereumBrowserDependencies } from './library/ethereum-browser-dependencies'
// import { PrivateFetchDependencies } from './library/private-fetch-dependencies'

// put the model on the window for debugging convenience
declare global { interface Window { rootModel: AppModel } }

const jsonRpcAddress = 'https://parity.zoltu.io'
const daiHrdAddress = 0x9b869c2eaae08136c43d824ea75a2f376f1aa983n

async function main() {
	const errorHandler = new ErrorHandler()

	const dependencies = new EthereumBrowserDependencies(jsonRpcAddress)
	// const dependencies = new PrivateFetchDependencies(jsonRpcAddress)
	const contracts = await Contracts.create(daiHrdAddress, dependencies)

	/**
	 * React Setup
	 */

	const rootModel = createOnChangeProxy<AppModel>(render, {
		connect: errorHandler.asyncWrapper(async () => {
			rootModel.account = 'connecting'
			const addresses = await dependencies.enable()
			if (addresses.length === 0) return
			const address = addresses[0]
			const [ allowance, attodaiHrdBalance, attodaiBalance ] = await Promise.all([
				contracts.dai.allowance_(address, contracts.daiHrd.address),
				contracts.daiHrd.balanceOf_(address),
				contracts.dai.balanceOf_(address),
			])
			rootModel.account = {
				approveDaiHrdToSpendDai: errorHandler.asyncWrapper(async () => {
					const account = rootModel.account
					if (account === undefined || account === 'connecting') return
					try {
						account.depositState = 'approving'
						await contracts.dai.approve(contracts.daiHrd.address, 2n**256n - 1n)
						account.depositState = 'approved'
					} catch (error) {
						account.depositState = 'not-approved'
						throw error
					}
				}),
				depositIntoDaiHrd: errorHandler.asyncWrapper(async (attodai: bigint) => {
					const account = rootModel.account
					if (account === undefined || account === 'connecting') return
					const originalDepositState = account.depositState
					try {
						account.depositState = 'depositing'
						await contracts.daiHrd.deposit(attodai)
						;[ account.attodaiHrdBalance, account.attodaiBalance ] = await Promise.all([
							contracts.daiHrd.balanceOf_(account.address),
							contracts.dai.balanceOf_(account.address),
						])
					} finally {
						account.depositState = originalDepositState
					}
				}),
				withdrawIntoDai: errorHandler.asyncWrapper(async (attodaiHrd: bigint) => {
					const account = rootModel.account
					if (account === undefined || account === 'connecting') return
					try {
						account.withdrawState = 'withdrawing'
						await contracts.daiHrd.withdrawTo(account.address, attodaiHrd)
						;[ account.attodaiHrdBalance, account.attodaiBalance ] = await Promise.all([
							contracts.daiHrd.balanceOf_(account.address),
							contracts.dai.balanceOf_(account.address),
						])
					} finally {
						account.withdrawState = 'idle'
					}
				}),
				address: address,
				attodaiHrdBalance,
				attodaiBalance,
				depositState: allowance > 0 ? 'approved' : 'not-approved',
				withdrawState: 'idle',
			}
		}),
		rontodsr: undefined,
		attodaiSupply: undefined,
		attodaiSavingsSupply: undefined,
		attodaiPerDaiHrd: undefined,
		ethereumBrowser: dependencies.noBrowserExtensionNeeded(),
		account: undefined,
	})
	window.rootModel = rootModel

	const main = document.querySelector('main')

	function render() {
		const element = React.createElement(App, rootModel)
		ReactDOM.render(element, main)
	}

	// kick off the initial render
	render()

	// populate initial values in parallel
	await Promise.all([
		// populate initial DSR in the model
		contracts.pot.dsr_().then(rontodsr => rootModel.rontodsr = rontodsr),
		// populate initial savings total supply in model
		contracts.pot.Pie_().then(savingsSupplyInAttodai => rootModel.attodaiSavingsSupply = { value: savingsSupplyInAttodai, timeSeconds: Date.now() / 1000 }),
		// populate initial total dai supply in model
		contracts.vat.debt_().then(totalDaiSupplyInAttorontodai => rootModel.attodaiSupply = totalDaiSupplyInAttorontodai / 10n**27n),
		// populate initial DAI:DAI-HRD exchange rate in model
		contracts.daiHrd.calculatedChi_().then(rontodaiPerPot => rootModel.attodaiPerDaiHrd = { value: rontodaiPerPot / 10n**9n, timeSeconds: Date.now() / 1000 }),
	])
}

main().catch(console.error)
