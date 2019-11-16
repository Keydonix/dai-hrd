export interface GetMetaMaskModel {
	style: React.CSSProperties
}

export function GetMetaMask(model: GetMetaMaskModel) {
	return <article className='panel' style={model.style}>
		<span>It appears that you do not have an Ethereum enabled browser.  Consider installing the <a href='https://metamask.io/'>MetaMask extension</a> in Chrome or Firefox.</span>
	</article>
}
