import { InfoButton } from './InfoButton';
import { Spinner, SpinnerPanel } from './Spinner';
import { decimalStringToBigintDai, bigintDaiToDecimalString } from '../library/conversion';

export interface DepositDaiModel {
	presentInfoTip: (info: string | JSX.Element) => void
	approveDaiHrdToSpendDai: () => void
	deposit: (attodai: bigint) => void
	depositState: 'querying' | 'not-approved' | 'approving' | 'approved' | 'depositing'
	attodaiBalance: bigint
	style?: React.CSSProperties
}

export function DepositDai(model: DepositDaiModel) {
	const [ daiToConvert, setDaiToConvert ] = React.useState('')
	const attodaiToConvert = decimalStringToBigintDai(daiToConvert)
	const depositClicked = () => {
		if (!attodaiToConvert) return
		model.deposit(attodaiToConvert)
		setDaiToConvert('')
	}

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
			<span style={{  }}>DAI <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5H12.6L11.3 6.3C10.9 6.7 10.9 7.3 11.3 7.7C11.5 7.9 11.7 8 12 8C12.3 8 12.5 7.9 12.7 7.7L15.7 4.7C16.1 4.3 16.1 3.7 15.7 3.3L12.7 0.3C12.3 -0.1 11.7 -0.1 11.3 0.3C10.9 0.7 10.9 1.3 11.3 1.7L12.6 3H1C0.4 3 0 3.4 0 4C0 4.6 0.4 5 1 5Z" fill="#E1E1E1"/><path d="M15 11H3.4L4.7 9.7C5.1 9.3 5.1 8.7 4.7 8.3C4.3 7.9 3.7 7.9 3.3 8.3L0.3 11.3C-0.1 11.7 -0.1 12.3 0.3 12.7L3.3 15.7C3.5 15.9 3.7 16 4 16C4.3 16 4.5 15.9 4.7 15.7C5.1 15.3 5.1 14.7 4.7 14.3L3.4 13H15C15.6 13 16 12.6 16 12C16 11.4 15.6 11 15 11Z" fill="#E1E1E1"/></svg> DAI-HRD</span>
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
			{bigintDaiToDecimalString(model.attodaiBalance, 2)} DAI
		</span>
		{model.depositState === undefined &&
			<section style={{ padding: '5px' }}>
				<Spinner/><InfoButton style={{ verticalAlign: 'top' }} onClick={() => model.presentInfoTip('Sit tight, we are looking up your details now to see if you have already approved DAI-HRD to transfer your DAI.')}/>
			</section>
		}
		{model.depositState === 'not-approved' &&
			<div onClick={model.approveDaiHrdToSpendDai} style={{
				width: '100%',
				height: '40px',
				left: '350px',
				top: '433px',
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
					Approve
				</div>
			</div>
			// <span>
			// 	<button style={{ marginTop: '5px' }} onClick={model.approveDaiHrdToSpendDai}>Approve</button>
			// 	<InfoButton style={{ verticalAlign: 'top' }} onClick={() => model.presentInfoTip('Unlike DAI-HRD, an ERC-777 & ERC20 token, DAI is only an ERC-20 token.  This means anytime you want to do something with it you have to first approve the contract to transfer your DAI on your behalf.')}/>
			// </span>
		}
		{model.depositState === 'approving' &&
			<SpinnerPanel/>
			// <InfoButton style={{ verticalAlign: 'top' }} onClick={() => model.presentInfoTip('Your approval allowing DaiHrd to convert your DAI has been submitted, we are now waiting for it to show up on the blockchain.  Refreshing the page will not stop the approval, but it will cause the page to lose track of it so this will go back to an approve button that you shouldn\'t click again!')}/>
		}
		{model.depositState === 'approved' &&
			<>
				<section style={{
					display: 'flex',
					flexDirection: 'row',
					gap: '12px',
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
					}} type='text' placeholder='Amount of DAI to convert' onChange={event => setDaiToConvert(event.target.value)} value={daiToConvert} />
					<div onClick={() => setDaiToConvert(bigintDaiToDecimalString(model.attodaiBalance))} style={{
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
					{attodaiToConvert &&
						<div onClick={depositClicked} style={{
							height: 'inherit',
							width: '100%',
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
								Start Earning
							</div>
						</div>
					}
				</section>
			</>
		}
		{model.depositState === 'depositing' &&
			<SpinnerPanel style={{ height: '95px' }}/>
			// <InfoButton style={{ verticalAlign: 'top' }} onClick={() => model.presentInfoTip('Your deposit has been submitted!  As soon as the transaction has been mined you will no longer be losing free money.')} />
		}
	</article>
}
