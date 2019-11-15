import { DaiHrdValue } from './DaiHrdValue';
import { TotalDaiLost } from './TotalDaiLost';
import { Modal } from './Modal';
import { DepositDai } from './DepositDai';
import { Connect } from './Connect';
import { GetMetaMask } from './GetMetaMask';

export interface AppModel {
	connect: () => void
	rontodsr: bigint | undefined
	attodaiSupply: bigint | undefined
	attodaiPerDaiHrd: bigint | undefined
	attodaiSavingsSupply: bigint | undefined
	ethereumBrowser: boolean,
	account: undefined | {
		readonly address: bigint
		depositState: 'not-approved' | 'approving' | 'approved' | 'depositing' | undefined
		depositIntoDaiHrd: (attodai: bigint) => void
		approveDaiHrdToSpendDai: () => void
	}
}

export function App(model: Readonly<AppModel>) {
	const [tipContent, setTipContent] = React.useState<string | JSX.Element | undefined>(undefined)
	return <div style={{ display: 'flex', justifyContent: 'center', width: 'calc(100vw - 30px)', height: 'calc(100vh - 30px)', backgroundColor: 'white', margin: '15px' }}>
		<section style={{ display: 'flex', flexDirection: 'column' }}>
			<TotalDaiLost presentInfoTip={setTipContent} rontodsr={model.rontodsr} attodaiSupply={model.attodaiSupply} attodaiSavingsSupply={model.attodaiSavingsSupply} />
			<DaiHrdValue presentInfoTip={setTipContent} rontodsr={model.rontodsr} attodaiPerDaiHrd={model.attodaiPerDaiHrd} />
			{!model.ethereumBrowser &&
				<GetMetaMask/>
			}
			{model.ethereumBrowser && !model.account &&
				<Connect connect={model.connect}/>
			}
			{model.account &&
				<DepositDai presentInfoTip={setTipContent} deposit={model.account.depositIntoDaiHrd} depositState={model.account.depositState} approveDaiHrdToSpendDai={model.account.approveDaiHrdToSpendDai} />
			}
			{tipContent &&
				<Modal content={tipContent} onClose={() => setTipContent(undefined)}/>
			}
		</section>
	</div>
}
