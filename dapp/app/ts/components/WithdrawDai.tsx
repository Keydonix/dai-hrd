import { decimalStringToBigintDai, bigintDaiToDecimalString, daiHrdToDai } from '../library/conversion';
import { SpinnerPanel } from './Spinner';

export interface WithdrawDaiModel {
	presentInfoTip: (info: string | JSX.Element) => void
	withdraw: (attodaiHrd: bigint) => void
	attodaiHrdBalance: bigint
	rontoDsr?: bigint
	attodaiPerDaiHrd?: { value: bigint, timeSeconds: number }
	withdrawState: 'idle' | 'withdrawing'
	style?: React.CSSProperties
}

export function WithdrawDai(model: Readonly<WithdrawDaiModel>) {
	const [ balanceInDai, setBalanceInDai ] = React.useState<undefined|number>(undefined)
	const [ daiHrdToWithdraw, setDaiHrdToWithdraw ] = React.useState('')
	const attodaiHrdToWithdraw = decimalStringToBigintDai(daiHrdToWithdraw)

	const withdrawClicked = () => {
		if (!attodaiHrdToWithdraw) return
		model.withdraw(attodaiHrdToWithdraw)
		setDaiHrdToWithdraw('')
	}

	React.useEffect(() => {
		const timerId = setInterval(() => {
			if (model.attodaiPerDaiHrd === undefined) return
			if (model.rontoDsr === undefined) return
			const dai = daiHrdToDai(model.attodaiHrdBalance, model.attodaiPerDaiHrd.value, model.rontoDsr, model.attodaiPerDaiHrd.timeSeconds)
			setBalanceInDai(dai)
		}, 1)
		return () => clearTimeout(timerId)
	}, [model.attodaiHrdBalance, model.attodaiPerDaiHrd, model.rontoDsr])

	return <article style={{
		display: 'flex',
		flexDirection: 'column',
		padding: '25px',
		backgroundColor: '#222632',
		borderRadius: '4px',
		...model.style,
	}}>
		<header style={{
			fontFamily: 'Open Sans',
			fontStyle: 'normal',
			fontWeight: 600,
			fontSize: '16px',
			lineHeight: '22px',
			display: 'flex',
			alignItems: 'center',
			color: '#F3F3F3',
		}}>
			<span style={{  }}>DAI-HRD ➜ DAI</span>
		</header>
		<span style={{
			fontFamily: 'Open Sans',
			fontStyle: 'normal',
			fontWeight: 'normal',
			fontSize: '14px',
			lineHeight: '19px',
			color: '#F3F3F3',
			flexGrow: 1,
		}}>
			{bigintDaiToDecimalString(model.attodaiHrdBalance, 3)} DAI-HRD ({balanceInDai === undefined ? '?' : balanceInDai.toFixed(3)} DAI)
		</span>
		{model.withdrawState === undefined &&
			<SpinnerPanel style={{ height: '95px' }}/>
			// <InfoButton style={{ verticalAlign: 'top' }} onClick={() => model.presentInfoTip('Sit tight, we are looking up your details now to see if you have already approved DAI-HRD to transfer your DAI.')}/>
		}
		{model.withdrawState === 'idle' &&
			<>
				<section style={{
					display: 'flex',
					flexDirection: 'row',
					height: '40px',
				}}>
					<input style={{
						height: 'inherit',
						border: '0px',
						padding: '0px 5px 0px 5px',
						flexGrow: 1,
						background: '#FFFFFF',
						borderRadius: '4px',
						fontFamily: 'Open Sans',
						fontStyle: 'normal',
						fontWeight: 'normal',
						fontSize: '14px',
					}} type='text' placeholder='DAI-HRD to withdraw' onChange={event => setDaiHrdToWithdraw(event.target.value)} value={daiHrdToWithdraw} />
					<div style={{ width: '12px' }}></div>
					<div onClick={() => setDaiHrdToWithdraw(bigintDaiToDecimalString(model.attodaiHrdBalance))} style={{
						height: 'inherit',
						width: '75px',
						background: '#00C3C2',
						borderRadius: '4px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: 'pointer',
					}}>
						<div style={{
							fontFamily: 'Open Sans',
							fontStyle: 'normal',
							fontWeight: 800,
							fontSize: '14px',
							lineHeight: '19px',
							display: 'flex',
							alignItems: 'center',
							textTransform: 'uppercase',
							color: '#FFFFFF',
						}}>
							Max
						</div>
					</div>
				</section>
				<div style={{ height: '15px' }}></div>
				<section style={{
					height: '40px',
				}}>
					{attodaiHrdToWithdraw &&
						<div onClick={withdrawClicked} style={{
							height: 'inherit',
							width: '100%',
							background: '#FF2D5E',
							borderRadius: '4px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
						}}>
							<div style={{
								fontFamily: 'Open Sans',
								fontStyle: 'normal',
								fontWeight: 800,
								fontSize: '14px',
								lineHeight: '19px',
								display: 'flex',
								alignItems: 'center',
								textTransform: 'uppercase',
								color: '#FFFFFF',
							}}>
								Stop Earning
							</div>
						</div>
					}
				</section>
			</>
		}
		{model.withdrawState === 'withdrawing' &&
			<SpinnerPanel style={{ height: '95px' }}/>
			// <InfoButton style={{ verticalAlign: 'top' }} onClick={() => model.presentInfoTip('Your withdraw has been submitted!  As soon as the transaction has been mined you will start losing money again.')} />
		}
	</article>
}
