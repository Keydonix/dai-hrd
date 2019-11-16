import { createOnChangeProxy } from './library/proxy'
import { App, AppModel } from './components/App'
import { ContractConnections as Contracts } from './library/contracts'
import { ErrorHandler } from './library/error-handler'
// import { EthereumBrowserDependencies } from './library/ethereum-browser-dependencies'
import { PrivateFetchDependencies } from './library/private-fetch-dependencies'

// put the model on the window for debugging convenience
declare global { interface Window { rootModel: AppModel } }

const jsonRpcAddress = 'http://127.0.0.1:8545'
const daiHrdAddress = 0xd2f610770e82faa6c4b514f47a673f70979a2aden

async function main() {
	const errorHandler = new ErrorHandler()

	// const dependencies = new EthereumBrowserDependencies(jsonRpcAddress)
	const dependencies = new PrivateFetchDependencies(jsonRpcAddress)
	const contracts = await Contracts.create(daiHrdAddress, dependencies)

	/**
	 * React Setup
	 */

	const rootModel = createOnChangeProxy<AppModel>(render, {
		connect: errorHandler.asyncWrapper(async () => {
			const accounts = await dependencies.enable()
			if (accounts.length === 0) return
			const account = accounts[0]
			const allowance = await contracts.dai.allowance_(account, contracts.daiHrd.address)
			rootModel.account = {
				approveDaiHrdToSpendDai: errorHandler.asyncWrapper(async () => {
					const account = rootModel.account
					if (account === undefined) return
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
					if (account === undefined) return
					const originalDepositState = account.depositState
					try {
						account.depositState = 'depositing'
						await contracts.daiHrd.deposit(attodai)
						account.attodaiHrdBalance = await contracts.daiHrd.balanceOf_(account.address)
						account.attodaiBalance = await contracts.dai.balanceOf_(account.address)
					} finally {
						account.depositState = originalDepositState
					}
				}),
				withdrawIntoDai: errorHandler.asyncWrapper(async (attodaiHrd: bigint) => {
					const account = rootModel.account
					if (account === undefined) return
					try {
						account.withdrawState = 'withdrawing'
						await contracts.daiHrd.withdrawTo(account.address, attodaiHrd)
						account.attodaiHrdBalance = await contracts.daiHrd.balanceOf_(account.address)
						account.attodaiBalance = await contracts.dai.balanceOf_(account.address)
					} finally {
						account.withdrawState = 'idle'
					}
				}),
				address: account,
				attodaiHrdBalance: await contracts.daiHrd.balanceOf_(account),
				attodaiBalance: await contracts.dai.balanceOf_(account),
				depositState: allowance > 0 ? 'approved' : 'not-approved',
				withdrawState: 'idle',
			}
		}),
		rontodsr: undefined,
		attodaiSupply: undefined,
		attodaiSavingsSupply: undefined,
		attodaiPerDaiHrd: undefined,
		ethereumBrowser: dependencies.needsBrowserExtension(),
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

	// populate initial DSR in the model
	const rontodsr = await contracts.pot.dsr_()
	rootModel.rontodsr = rontodsr

	// populate initial savings total supply in model
	const savingsSupplyInAttodai = await contracts.pot.Pie_()
	rootModel.attodaiSavingsSupply = { value: savingsSupplyInAttodai, timeSeconds: Date.now() / 1000 }

	// populate initial total dai supply in model
	const totalDaiSupplyInAttorontodai = await contracts.vat.debt_()
	rootModel.attodaiSupply = totalDaiSupplyInAttorontodai / 10n**27n

	// populate initial DAI:DAI-HRD exchange rate in model
	const rontodaiPerPot = await contracts.daiHrd.calculatedChi_()
	rootModel.attodaiPerDaiHrd = { value: rontodaiPerPot / 10n**9n, timeSeconds: Date.now() / 1000 }
}

main().catch(console.error)
