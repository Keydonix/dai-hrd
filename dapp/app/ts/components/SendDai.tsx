import { daiHrdToDai, bigintDaiToDecimalString, decimalStringToBigintDai, tryHexStringAddressToBigint } from '../library/conversion'
import { SpinnerPanel } from './Spinner'

export interface SendDaiModel {
	sendDai: (recipient: bigint, attodai: bigint) => Promise<void>
	attodaiHrdBalance: bigint
	attodaiPerDaiHrd?: { value: bigint, timeSeconds: number }
	rontoDsr?: bigint
	style?: React.CSSProperties
}

export function SendDai(model: SendDaiModel) {
	const [ balanceInDai, setBalanceInDai ] = React.useState<undefined | number>(undefined)
	const [ daiToSendString, setDaiToSendString ] = React.useState('')
	const [ destinationString, setDestinationString ] = React.useState('')
	const [ isSending, setIsSending ] = React.useState(false)
	const destination = tryHexStringAddressToBigint(destinationString)
	const attodaiToSend = decimalStringToBigintDai(daiToSendString)

	React.useEffect(() => {
		const timerId = setInterval(() => {
			if (model.attodaiPerDaiHrd === undefined) return
			if (model.rontoDsr === undefined) return
			const dai = daiHrdToDai(model.attodaiHrdBalance, model.attodaiPerDaiHrd.value, model.rontoDsr, model.attodaiPerDaiHrd.timeSeconds)
			setBalanceInDai(dai)
		}, 1)
		return () => clearTimeout(timerId)
	}, [model.attodaiHrdBalance, model.attodaiPerDaiHrd, model.rontoDsr])

	const sendClicked = () => {
		if (!attodaiToSend) return
		if (!destination) return
		setIsSending(true)
		model.sendDai(destination, attodaiToSend).finally(() => setIsSending(false))
		setDestinationString('')
		setDaiToSendString('')
	}

	return <article style={{ display: 'flex', flexDirection: 'column', padding: '25px', backgroundColor: '#222632', borderRadius: '4px', ...model.style }}>
		<header style={{ fontFamily: 'Open Sans', fontStyle: 'normal', fontWeight: 600, fontSize: '16px', lineHeight: '22px', display: 'flex', alignItems: 'center', color: '#F3F3F3' }}>
			Send DAI
		</header>
		<span style={{ fontFamily: 'Open Sans', fontStyle: 'normal', fontWeight: 'normal', fontSize: '14px', lineHeight: '19px', color: '#F3F3F3', flexGrow: 1 }}>
			{balanceInDai === undefined ? '?' : balanceInDai.toFixed(3)} DAI ({bigintDaiToDecimalString(model.attodaiHrdBalance, 3)} DAI-HRD)
		</span>
		<div style={{ height: '15px' }}></div>
		{isSending && <>
			<SpinnerPanel style={{ height: '150px' }}/>
		</>}
		{!isSending && <>
			<input style={{ height: '36px', padding: '0px 5px 0px 5px', flexGrow: 1, background: '#FFFFFF', borderRadius: '4px', fontFamily: 'Open Sans', fontStyle: 'normal', fontWeight: 'normal', fontSize: '14px', borderColor: (destination !== undefined || destinationString === '') ? 'transparent' : 'red', borderWidth: '2px', borderStyle: 'solid' }} type='text' placeholder='Destination: 0xadd12e55add12e55add12e55add12e55add12e55' onChange={event => setDestinationString(event.target.value)} value={destinationString}/>
			<div style={{ height: '15px' }}></div>
			<input style={{ height: '40px', border: '0px', padding: '0px 5px 0px 5px', flexGrow: 1, background: '#FFFFFF', borderRadius: '4px', fontFamily: 'Open Sans', fontStyle: 'normal', fontWeight: 'normal', fontSize: '14px' }} type='text' placeholder='DAI to send: 9.97' onChange={event => setDaiToSendString(event.target.value)} value={daiToSendString}/>
			<div style={{ height: '15px' }}></div>
			{attodaiToSend
				? <div onClick={sendClicked} style={{ height: '40px', width: '100%', background: '#00C3C2', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
					<div style={{ fontFamily: 'Open Sans', fontStyle: 'normal', fontWeight: 800, fontSize: '14px', lineHeight: '19px', display: 'flex', alignItems: 'center', textTransform: 'uppercase', color: '#FFFFFF' }}>
						Send DAI
					</div>
				</div>
				: <div style={{ height: '40px' }}></div>
			}
		</>}
	</article>
}
