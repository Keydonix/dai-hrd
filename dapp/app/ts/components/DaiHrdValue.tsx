import { InfoButton } from './InfoButton';

export interface DaiHrdValueModel {
	presentInfoTip: (info: string | JSX.Element) => void
	rontodsr: bigint | undefined
	attodaiPerDaiHrd: bigint | undefined
}

export const DaiHrdValue = (model: Readonly<DaiHrdValueModel>) => {
	const [startTimeSeconds] = React.useState(Date.now() / 1000)
	const [daiHrdValue, setDaiHrdValue] = React.useState(1)
	setTimeout(async () => {
		if (model.attodaiPerDaiHrd === undefined) return
		if (model.rontodsr === undefined) return
		const nowSeconds = Date.now() / 1000
		const elapsed = nowSeconds - startTimeSeconds
		setDaiHrdValue((Number(model.rontodsr) / 10**27) ** elapsed * Number(model.attodaiPerDaiHrd) / 10**18)
	}, 1)

	const onClick = () => model.presentInfoTip(``)

	return <div>
		DAI-HRD Value Increase:&nbsp;&nbsp;<InfoButton onClick={onClick}/>
		<h2>{daiHrdValue.toFixed(10)} DAI</h2>
	</div>
}
