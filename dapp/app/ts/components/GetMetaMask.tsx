export interface GetMetaMaskModel {
	style?: React.CSSProperties
}

export function GetMetaMask(_model: GetMetaMaskModel) {
	return <article style={{
		backgroundColor: '#222632',
		borderRadius: '4px',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		padding: '25px',
		width: '350px',
		height: '150px',
		color: '#B6B6B6',
		fontFamily: 'Open Sans',
		fontStyle: 'normal',
		fontWeight: 'normal',
	}}>
		<span>It appears that you do not have an Ethereum enabled browser.  Consider installing the <a style={{ color: '#00C3C2' }} href='https://metamask.io/'>MetaMask extension</a> in Chrome or Firefox.</span>
	</article>
}
