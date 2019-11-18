import { DaiHrdValue } from './DaiHrdValue';
import { TotalDaiLost } from './TotalDaiLost';
import { Modal } from './Modal';
import { DepositDai } from './DepositDai';
import { Connect } from './Connect';
import { GetMetaMask } from './GetMetaMask';
import { WithdrawDai } from './WithdrawDai';
import { SpinnerPanel } from './Spinner';

export interface AppModel {
	readonly connect: () => void
	rontodsr: bigint | undefined
	attodaiSupply: bigint | undefined
	attodaiPerDaiHrd: undefined | { value: bigint, timeSeconds: number }
	attodaiSavingsSupply: undefined | { value: bigint, timeSeconds: number }
	ethereumBrowser: boolean,
	account: undefined | 'connecting' | {
		readonly address: bigint
		readonly approveDaiHrdToSpendDai: () => void
		readonly depositIntoDaiHrd: (attodai: bigint) => void
		readonly withdrawIntoDai: (attodaiHrd: bigint) => void
		attodaiHrdBalance: bigint
		attodaiBalance: bigint
		depositState: 'querying' | 'not-approved' | 'approving' | 'approved' | 'depositing'
		withdrawState: 'idle' | 'withdrawing'
	}
}

export function App(model: Readonly<AppModel>) {
	const [tipContent, setTipContent] = React.useState<string | JSX.Element | undefined>(undefined)
	return <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: 'white', margin: '15px' }}>
		<section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: '1fr', gridGap: '10px' }}>
			{model.rontodsr && model.attodaiSupply && model.attodaiSavingsSupply &&
				<TotalDaiLost presentInfoTip={setTipContent} rontodsr={model.rontodsr} attodaiSupply={model.attodaiSupply} attodaiSavingsSupply={model.attodaiSavingsSupply} />
			}
			{model.rontodsr && model.attodaiPerDaiHrd &&
				<DaiHrdValue presentInfoTip={setTipContent} rontodsr={model.rontodsr} attodaiPerDaiHrd={model.attodaiPerDaiHrd} />
			}
			{!model.ethereumBrowser &&
				<GetMetaMask style={{ gridColumn: '1/3' }}/>
			}
			{model.ethereumBrowser && !model.account &&
				<Connect style={{ gridColumn: '1/3' }} connect={model.connect}/>
			}
			{model.account === 'connecting' &&
				<SpinnerPanel style={{ gridColumn: '1/3' }}/>
			}
			{model.account && model.account !== 'connecting' &&
				<DepositDai presentInfoTip={setTipContent} deposit={model.account.depositIntoDaiHrd} attodaiBalance={model.account.attodaiBalance} depositState={model.account.depositState} approveDaiHrdToSpendDai={model.account.approveDaiHrdToSpendDai} />
			}
			{model.account && model.account !== 'connecting' && model.account.attodaiHrdBalance && model.rontodsr && model.attodaiPerDaiHrd &&
				<WithdrawDai presentInfoTip={setTipContent} withdraw={model.account.withdrawIntoDai} withdrawState={model.account.withdrawState} attodaiHrdBalance={model.account.attodaiHrdBalance} attodaiPerDaiHrd={model.attodaiPerDaiHrd} rontoDsr={model.rontodsr} />
			}
			{tipContent &&
				<Modal content={tipContent} onClose={() => setTipContent(undefined)}/>
			}
		</section>
	</div>
}
