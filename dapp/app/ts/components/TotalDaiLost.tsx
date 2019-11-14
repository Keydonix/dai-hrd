import { InfoButton } from './InfoButton';

export interface TotalDaiLostModel {
	presentInfoTip: (info: string | JSX.Element) => void
	rontodsr: bigint | undefined
	attodaiSupply: bigint | undefined
	attodaiSavingsSupply: bigint | undefined
}

export const TotalDaiLost = (model: Readonly<TotalDaiLostModel>) => {
	const [startTimeSeconds] = React.useState(Date.now() / 1000)
	const [daiLost, setDaiLost] = React.useState(0)
	setTimeout(async () => {
		if (model.rontodsr === undefined) return
		if (model.attodaiSupply === undefined) return
		if (model.attodaiSavingsSupply === undefined) return
		const nowSeconds = Date.now() / 1000
		const elapsed = nowSeconds - startTimeSeconds
		const unvattedDai = (Number(model.attodaiSupply) - Number(model.attodaiSavingsSupply)) / 10**18
		setDaiLost((Number(model.rontodsr) / 10**27) ** elapsed * unvattedDai)
	}, 1)

	const onClick = () => model.presentInfoTip(``)

	return <div>
		DAI Lost:&nbsp;&nbsp;<InfoButton onClick={onClick}/>
		<h2>{daiLost.toFixed(10)} DAI</h2>
	</div>
}
