import { DaiHrd, Pot, Vat, Dai, Dependencies } from '@keydonix/dai-hrd'

export class ContractConnections {
	private constructor(
		public readonly daiHrd: DaiHrd,
		public readonly dai: Dai,
		public readonly pot: Pot,
		public readonly vat: Vat,
	) {}

	public static readonly create = async (daiHrdAddress: bigint, dependencies: Dependencies): Promise<ContractConnections> => {
		const daiHrd = new DaiHrd(dependencies, daiHrdAddress)
		const [daiAddress, potAddress, vatAddress] = await Promise.all([daiHrd.dai_(), daiHrd.pot_(), daiHrd.vat_()])
		const dai = new Dai(dependencies, daiAddress)
		const pot = new Pot(dependencies, potAddress)
		const vat = new Vat(dependencies, vatAddress)
		return new ContractConnections(daiHrd, dai, pot, vat)
	}
}
