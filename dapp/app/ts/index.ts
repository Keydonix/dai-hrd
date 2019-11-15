import { encodeMethod } from '@zoltu/ethereum-abi-encoder'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { keccak256 } from '@zoltu/ethereum-crypto'
import { Dependencies } from '@keydonix/dai-hrd'
import { createOnChangeProxy } from './library/proxy'
import { App, AppModel } from './components/App'
import { EthereumBrowserDependencies } from './library/ethereum-browser'
import { ContractConnections as Contracts } from './library/contracts'
import { ErrorHandler } from './library/error-handler'

// put the model on the window for debugging convenience
declare global { interface Window { rootModel: AppModel } }

async function main() {
	const errorHandler = new ErrorHandler()

	// TODO: use metamask if available
	const rpc = new FetchJsonRpc('http://127.0.0.1:8545', window.fetch.bind(window), async () => 10n**9n)
	const fetchJsonRpcDependencies: Dependencies = {
		call: async (to, methodSignature, parameters, value) => await rpc.offChainContractCall({ to, data: await encodeMethod(keccak256.hash, methodSignature, parameters), value }),
		submitTransaction: async () => { throw new Error(`Transaction signing not supported.  Consider using MetaMask instead.`) }
	}
	const ethereumBrowserDependencies = new EthereumBrowserDependencies(fetchJsonRpcDependencies)

	/**
	 * React Setup
	 */

	const rootModel = createOnChangeProxy<AppModel>(render, {
		connect: errorHandler.asyncWrapper(async () => {
			const accounts = await ethereumBrowserDependencies.enable()
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
						account.depositState = originalDepositState
					} catch (error) {
						account.depositState = originalDepositState
					}
				}),
				address: accounts[0],
				depositState: allowance > 0 ? 'approved' : 'not-approved'
			}
		}),
		rontodsr: undefined,
		attodaiSupply: undefined,
		attodaiSavingsSupply: undefined,
		attodaiPerDaiHrd: undefined,
		ethereumBrowser: !!window.ethereum,
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

	const contracts = await Contracts.create(0xd2f610770e82faa6c4b514f47a673f70979a2aden, ethereumBrowserDependencies)

	// populate initial DSR in the model
	const rontodsr = await contracts.pot.dsr_()
	rootModel.rontodsr = rontodsr

	// populate initial savings total supply in model
	const savingsSupplyInAttodai = await contracts.pot.Pie_()
	rootModel.attodaiSavingsSupply = savingsSupplyInAttodai

	// populate initial total dai supply in model
	const totalDaiSupplyInAttorontodai = await contracts.vat.debt_()
	rootModel.attodaiSupply = totalDaiSupplyInAttorontodai / 10n**27n

	// populate initial DAI:DAI-HRD exchange rate in model
	const rontodaiPerPot = await contracts.daiHrd.calculatedChi_()
	rootModel.attodaiPerDaiHrd = rontodaiPerPot / 10n**9n
}

main().catch(console.error)
