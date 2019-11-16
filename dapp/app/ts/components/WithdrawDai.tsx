import { InfoButton } from './InfoButton';
import { decimalStringToBigintDai, bigintDaiToDecimalString, daiHrdToDai } from '../library/conversion';
import { Spinner } from './Spinner';

export interface WithdrawDaiModel {
	presentInfoTip: (info: string | JSX.Element) => void
	withdraw: (attodaiHrd: bigint) => void
	attodaiHrdBalance: bigint
	rontoDsr: bigint
	attodaiPerDaiHrd: { value: bigint, timeSeconds: number }
	withdrawState: 'idle' | 'withdrawing'
}

export function WithdrawDai(model: Readonly<WithdrawDaiModel>) {
	const [ balanceInDai, setBalanceInDai ] = React.useState(0)
	const [ daiHrdToWithdraw, setDaiHrdToWithdraw ] = React.useState('')
	const attodaiHrdToWithdraw = decimalStringToBigintDai(daiHrdToWithdraw)

	React.useEffect(() => {
		const timerId = setInterval(() => setBalanceInDai(daiHrdToDai(model.attodaiHrdBalance, model.attodaiPerDaiHrd.value, model.rontoDsr, model.attodaiPerDaiHrd.timeSeconds)), 1)
		return () => clearTimeout(timerId)
	}, [])

	return <article className='panel'>
		<header style={{  }}>
			DAI-HRD to DAI
			<InfoButton onClick={() => model.presentInfoTip('Remember, as soon as you withdraw to DAI you stop getting interest!')}/>
		</header>
		<section>
			<>
				<span>{bigintDaiToDecimalString(model.attodaiHrdBalance, 3)} DAI-HRD</span>
				<span>({balanceInDai.toFixed(3)} DAI)</span>
			</>
			{model.withdrawState === 'idle' &&
				<>
					<span>
						<input style={{ margin: '5px' }} type='text' placeholder='Amount of DAI-HRD to withdraw.' onChange={event => setDaiHrdToWithdraw(event.target.value)} value={daiHrdToWithdraw} />
						<button onClick={() => setDaiHrdToWithdraw(bigintDaiToDecimalString(model.attodaiHrdBalance))}>Max</button>
					</span>
					{attodaiHrdToWithdraw &&
						<button onClick={() => attodaiHrdToWithdraw ? model.withdraw(attodaiHrdToWithdraw) : undefined }>Stop Earning</button>
					}
				</>
			}
			{model.withdrawState === 'withdrawing' &&
				<span>
					<Spinner/>
					<InfoButton style={{ verticalAlign: 'top' }} onClick={() => model.presentInfoTip('Your withdraw has been submitted!  As soon as the transaction has been mined you will start losing money again.')} />
				</span>
			}
		</section>
	</article>
}
