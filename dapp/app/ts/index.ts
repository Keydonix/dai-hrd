import { encodeMethod } from '@zoltu/ethereum-abi-encoder'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { keccak256 } from '@zoltu/ethereum-crypto'
import { DaiHrd, Dependencies, Pot, Vat } from '@keydonix/dai-hrd'
import { createOnChangeProxy } from './library/proxy'
import { App, AppModel } from './components/App'

// TODO: use metamask if available
const rpc = new FetchJsonRpc('http://127.0.0.1:8545', window.fetch.bind(window), async () => 10n**9n)
const dependencies: Dependencies = {
	call: async (to, methodSignature, parameters, value) => await rpc.offChainContractCall({ to, data: await encodeMethod(keccak256.hash, methodSignature, parameters), value }),
	submitTransaction: async () => { throw new Error(`Transaction signing not supported.  Consider using MetaMask instead.`) }
}
const daiHrd = new DaiHrd(dependencies, 0xce77d3c706e0fe6da5d71b1249756b5ea0d77202n)

/**
 * React Setup
 */

const rootModel = createOnChangeProxy<AppModel>(render, {
	presentInfoTip: () => {},
	rontodsr: undefined,
	attodaiSupply: undefined,
	attodaiSavingsSupply: undefined,
	attodaiPerDaiHrd: undefined,
})
// put the model on the window for debugging convenience
declare global { interface Window { rootModel: AppModel } }
window.rootModel = rootModel

const main = document.querySelector('main')

function render() {
	const element = React.createElement(App, rootModel)
	ReactDOM.render(element, main)
}

// kick off the initial render
render()

// populate DSR in the model
daiHrd.pot_().then(pot => new Pot(dependencies, pot).dsr_()).then(rontodsr => rootModel.rontodsr = rontodsr)
daiHrd.calculatedChi_().then(rontodaiPerPot => rootModel.attodaiPerDaiHrd = rontodaiPerPot / 10n**9n)
daiHrd.vat_().then(vat => new Vat(dependencies, vat).debt_()).then(attorontodai => rootModel.attodaiSupply = attorontodai / 10n**27n)
daiHrd.pot_().then(pot => new Pot(dependencies, pot).Pie_()).then(attodai => rootModel.attodaiSavingsSupply = attodai)
