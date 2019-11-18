export function Spinner() {
	return <span style={{ display: 'inline-block' }}><div className='spinner'></div></span>
}

export interface SpinnerPanelModel {
	style: React.CSSProperties
}

export function SpinnerPanel(model: SpinnerPanelModel) {
	return <div className='panel' style={model.style}>
		<Spinner />
	</div>
}
