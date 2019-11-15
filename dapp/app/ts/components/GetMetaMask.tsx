export interface GetMetaMaskModel {

}

export function GetMetaMask(_model: GetMetaMaskModel) {
	return <div className='panel'>
		It appears that you do not have an Ethereum enabled browser.  Consider installing the <a href='https://metamask.io/'>MetaMask extension</a> in Chrome or Firefox.
	</div>
}
