import { compile } from './helpers'

export async function compileMaker() {
	const makerContracts = ['cat', 'dai', 'end', 'flap', 'flip', 'flop', 'join', 'jug', 'lib', 'pot', 'spot', 'vat', 'vow', 'esm/ESM', 'esm/note', 'DssDeploy', 'ds-token/ds-auth/auth', 'ds-token/ds-math/math', 'ds-token/erc20/erc20', 'ds-token/base', 'ds-token/factory', 'ds-token/token'] as const
	await compile('maker', makerContracts.map(x => `${x}.sol`))
}
