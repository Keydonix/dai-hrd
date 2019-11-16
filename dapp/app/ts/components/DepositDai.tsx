import { InfoButton } from './InfoButton';
import { Spinner } from './Spinner';
import { decimalStringToBigintDai, bigintDaiToDecimalString } from '../library/conversion';

export interface DepositDaiModel {
	presentInfoTip: (info: string | JSX.Element) => void
	approveDaiHrdToSpendDai: () => void
	deposit: (attodai: bigint) => void
	depositState: 'querying' | 'not-approved' | 'approving' | 'approved' | 'depositing'
	attodaiBalance: bigint
}

export function DepositDai(model: DepositDaiModel) {
	const [ daiToConvert, setDaiToConvert ] = React.useState('')
	const attodaiToConvert = decimalStringToBigintDai(daiToConvert)

	return <article className='panel'>
		<header>DAI to DAI-HRD</header>
		<section style={{ display: 'flex', flexGrow: 1, flexDirection: 'column', justifyContent: 'center' }}>
			<>
				<span>{bigintDaiToDecimalString(model.attodaiBalance, 2)} DAI</span>
			</>
			{model.depositState === undefined &&
				<section style={{ padding: '5px' }}>
					<Spinner/><InfoButton style={{ verticalAlign: 'top' }} onClick={() => model.presentInfoTip('Sit tight, we are looking up your details now to see if you have already approved DAI-HRD to transfer your DAI.')}/>
				</section>
			}
			{model.depositState === 'not-approved' &&
				<span>
					<button style={{ marginTop: '5px' }} onClick={model.approveDaiHrdToSpendDai}>Approve</button>
					<InfoButton style={{ verticalAlign: 'top' }} onClick={() => model.presentInfoTip('Unlike DAI-HRD, an ERC-777 & ERC20 token, DAI is only an ERC-20 token.  This means anytime you want to do something with it you have to first approve the contract to transfer your DAI on your behalf.')}/>
				</span>
			}
			{model.depositState === 'approving' &&
				<span>
					<Spinner/>
					<InfoButton style={{ verticalAlign: 'top' }} onClick={() => model.presentInfoTip('Your approval allowing DaiHrd to convert your DAI has been submitted, we are now waiting for it to show up on the blockchain.  Refreshing the page will not stop the approval, but it will cause the page to lose track of it so this will go back to an approve button that you shouldn\'t click again!')}/>
				</span>
			}
			{model.depositState === 'approved' &&
				<>
					<span>
						<input style={{ margin: '5px' }} type='text' placeholder='Amount of DAI to convert.' onChange={event => setDaiToConvert(event.target.value)} value={daiToConvert} />
						<button onClick={() => setDaiToConvert(bigintDaiToDecimalString(model.attodaiBalance))}>Max</button>
					</span>
					{attodaiToConvert &&
						<button onClick={() => attodaiToConvert ? model.deposit(attodaiToConvert) : undefined }>Start Earning</button>
					}
				</>
			}
			{model.depositState === 'depositing' &&
				<span>
					<Spinner/>
					<InfoButton style={{ verticalAlign: 'top' }} onClick={() => model.presentInfoTip('Your deposit has been submitted!  As soon as the transaction has been mined you will no longer be losing free money.')} />
				</span>
			}
		</section>
	</article>
}
