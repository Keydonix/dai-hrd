export interface ConnectModel {
	style?: React.CSSProperties
	connect: () => void
}

export function Connect(model: ConnectModel) {
	return <div onClick={model.connect} style={{
		width: '194px',
		height: '40px',
		left: '543px',
		top: '355px',
		background: '#00C3C2',
		borderRadius: '4px',
		cursor: 'pointer',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		...model.style,
	}}>
		<div style={{
			fontFamily: 'Open Sans',
			fontStyle: 'normal',
			fontWeight: 800,
			fontSize: '14px',
			lineHeight: '19px',
			display: 'flex',
			alignItems: 'center',
			textAlign: 'center',
			textTransform: 'uppercase',
			color: '#FFFFFF',
		}}>
			Connect
		</div>
	</div>
}
