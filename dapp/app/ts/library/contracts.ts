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
		const dai = new Dai(dependencies, await daiHrd.dai_())
		const pot = new Pot(dependencies, await daiHrd.pot_())
		const vat = new Vat(dependencies, await daiHrd.vat_())
		return new ContractConnections(daiHrd, dai, pot, vat)
	}
}
