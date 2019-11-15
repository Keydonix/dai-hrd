export interface ConnectModel {
	style: React.CSSProperties
	connect: () => void
}

export function Connect(model: ConnectModel) {
	return <div className='panel' style={model.style}>
		<button onClick={model.connect}>Connect</button>
	</div>
}
