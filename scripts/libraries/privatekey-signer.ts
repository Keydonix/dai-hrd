import { ethereum, secp256k1 } from '@zoltu/ethereum-crypto'
import { Bytes } from '@zoltu/ethereum-types';

export class PrivateKeySigner {
	private constructor(
		public readonly privateKey: bigint,
		public readonly publicKey: secp256k1.AffinePoint & secp256k1.JacobianPoint,
		public readonly address: bigint,
	) { }

	public static readonly create = async (privateKey: bigint) => {
		const publicKey = await secp256k1.privateKeyToPublicKey(privateKey)
		const address = await ethereum.publicKeyToAddress(publicKey)
		return new PrivateKeySigner(privateKey, publicKey, address)
	}

	public static readonly createTest = async () => await PrivateKeySigner.create(0xfae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5an)

	public readonly sign = async (message: Bytes): Promise<{ r: bigint, s: bigint, yParity: 'even'|'odd' }> => {
		const signature = await ethereum.signRaw(this.privateKey, message)
		return {
			r: signature.r,
			s: signature.s,
			yParity: signature.recoveryParameter === 0 ? 'even' : 'odd',
		}
	}
}
