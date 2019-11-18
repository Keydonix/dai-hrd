import { daiHrdToDai } from '../library/conversion';

export interface DaiWastedModel {
	presentInfoTip: (info: string | JSX.Element) => void
	rontodsr: bigint
	attodaiSupply: bigint
	attodaiSavingsSupply: { value: bigint, timeSeconds: number }
}

export function DaiWasted(model: Readonly<DaiWastedModel>) {
	const [daiLost, setDaiLost] = React.useState(0)
	setTimeout(async () => {
		const unvattedAttodai = model.attodaiSupply - model.attodaiSavingsSupply.value
		setDaiLost(daiHrdToDai(unvattedAttodai, 10n**18n, model.rontodsr, model.attodaiSavingsSupply.timeSeconds))
	}, 1)

	return <article style={{
		width: '575px',
		height: '150px',
		backgroundColor: '#222632',
		borderRadius: '4px',
		padding: '25px',
		display: 'flex',
		flexDirection: 'column',
		color: '#F3F3F3',
	}}>
		<header style={{
			fontFamily: 'Open Sans',
			fontStyle: 'normal',
			fontWeight: 600,
		}}>
			DAI Wasted
		</header>
		<section style={{
			flexGrow: 1,
			fontFamily: 'Open Sans',
			fontStyle: 'normal',
			fontWeight: 800,
			fontSize: '36px',
			lineHeight: '49px',
			display: 'flex',
			alignItems: 'center',
		}}>
			{daiLost.toFixed(10)} DAI
		</section>
		<footer style={{
			fontFamily: 'Open Sans',
			fontStyle: 'normal',
			fontWeight: 'normal',
			color: '#B6B6B6',
		}}>
			The amount of DAI that has gone to MKR holders instead of DAI holders because people are using DAI instead of DAI-HRD.
		</footer>
	</article>
}
