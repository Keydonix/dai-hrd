import { InfoButton } from './InfoButton';
import { daiHrdToDai } from '../library/conversion';

export interface DaiHrdValueModel {
	presentInfoTip: (info: string | JSX.Element) => void
	rontodsr: bigint | undefined
	attodaiPerDaiHrd: undefined | { value: bigint, timeSeconds: number }
}

export function DaiHrdValue(model: Readonly<DaiHrdValueModel>) {
	const [daiHrdValue, setDaiHrdValue] = React.useState(1)
	setTimeout(async () => {
		if (model.attodaiPerDaiHrd === undefined) return
		if (model.rontodsr === undefined) return
		setDaiHrdValue(daiHrdToDai(10n**18n, model.attodaiPerDaiHrd.value, model.rontodsr, model.attodaiPerDaiHrd.timeSeconds))
	}, 1)

	return <article className='panel'>
		<header>
			DAI-HRD Value Increase<InfoButton onClick={() => model.presentInfoTip('If you had converted 1 DAI to DAI-HRD when opening this page, this is how much DAI it would be worth now.')}/>
		</header>
		<section>
			<h2>{daiHrdValue.toFixed(10)} DAI</h2>
		</section>
	</article>
}
