import { InfoButton } from './InfoButton';
import { daiHrdToDai } from '../library/conversion';

export interface DaiHrdValueModel {
	presentInfoTip: (info: string | JSX.Element) => void
	rontodsr: bigint | undefined
	attodaiPerDaiHrd: undefined | { value: bigint, timeSeconds: number }
}

export function DaiHrdValue(model: Readonly<DaiHrdValueModel>) {
	const [daiHrdValue, setDaiHrdValue] = React.useState(1)

	React.useEffect(() => {
		const timerId = setInterval(() => {
			if (model.attodaiPerDaiHrd === undefined) return
			if (model.rontodsr === undefined) return
			setDaiHrdValue(daiHrdToDai(10n**18n, model.attodaiPerDaiHrd.value, model.rontodsr, model.attodaiPerDaiHrd.timeSeconds))
		}, 1)
		return () => clearTimeout(timerId)
	}, [])

	return <article className='panel'>
		<header>
			DAI-HRD Value<InfoButton onClick={() => model.presentInfoTip('The current value of 1 DAI-HRD denominated in DAI.')}/>
		</header>
		<section>
			<h2>{daiHrdValue.toFixed(10)} DAI</h2>
		</section>
	</article>
}
