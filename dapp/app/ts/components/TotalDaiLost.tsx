import { InfoButton } from './InfoButton';
import { daiHrdToDai } from '../library/conversion';

export interface TotalDaiLostModel {
	presentInfoTip: (info: string | JSX.Element) => void
	rontodsr: bigint
	attodaiSupply: bigint
	attodaiSavingsSupply: { value: bigint, timeSeconds: number }
}

export function TotalDaiLost(model: Readonly<TotalDaiLostModel>) {
	const [daiLost, setDaiLost] = React.useState(0)
	setTimeout(async () => {
		const unvattedAttodai = model.attodaiSupply - model.attodaiSavingsSupply.value
		setDaiLost(daiHrdToDai(unvattedAttodai, 10n**18n, model.rontodsr, model.attodaiSavingsSupply.timeSeconds))
	}, 1)

	return <article className='panel'>
		<header>
			DAI Lost<InfoButton onClick={() => model.presentInfoTip('The amount of DAI that has gone to MKR holders instead of DAI holders because people are using DAI instead of DAI-HRD.  This is free money that is being given away to MKR holders as a poorly documented fee.')}/>
		</header>
		<section>
			<h2>{daiLost.toFixed(10)} DAI</h2>
		</section>
	</article>
}
