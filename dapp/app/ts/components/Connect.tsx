export interface ConnectModel {
	connect: () => void
}

export function Connect(model: ConnectModel) {
	return <div className='panel'>
		<button onClick={model.connect}>Connect</button>
	</div>
}
