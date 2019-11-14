import { DaiHrdValue } from './DaiHrdValue';
import { TotalDaiLost } from './TotalDaiLost';

export interface AppModel {
	presentInfoTip: (info: string | JSX.Element) => void
	rontodsr: bigint | undefined
	attodaiSupply: bigint | undefined
	attodaiPerDaiHrd: bigint | undefined
	attodaiSavingsSupply: bigint | undefined
}

export const App = (model: Readonly<AppModel>) => <>
	<TotalDaiLost presentInfoTip={model.presentInfoTip} rontodsr={model.rontodsr} attodaiSupply={model.attodaiSupply} attodaiSavingsSupply={model.attodaiSavingsSupply} />
	<DaiHrdValue presentInfoTip={model.presentInfoTip} rontodsr={model.rontodsr} attodaiPerDaiHrd={model.attodaiPerDaiHrd} />
</>
