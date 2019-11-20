import { bigintDaiToDecimalString, decimalStringToBigintDai, tryHexStringAddressToBigint } from '../library/conversion'
import { SpinnerPanel } from './Spinner'

export interface SendDaiHrdModel {
	sendDaiHrd: (recipient: bigint, attodaiHrd: bigint) => Promise<void>
	attodaiHrdBalance: bigint
	attodaiPerDaiHrd?: { value: bigint, timeSeconds: number }
	rontoDsr?: bigint
	style?: React.CSSProperties
}

export function SendDaiHrd(model: SendDaiHrdModel) {
	const [ daiHrdToSendString, setDaiHrdToSendString ] = React.useState('')
	const [ destinationString, setDestinationString ] = React.useState('')
	const [ isSending, setIsSending ] = React.useState(false)
	const destination = tryHexStringAddressToBigint(destinationString)
	const attodaiHrdToSend = decimalStringToBigintDai(daiHrdToSendString)

	const sendClicked = () => {
		if (!attodaiHrdToSend) return
		if (!destination) return
		setIsSending(true)
		model.sendDaiHrd(destination, attodaiHrdToSend).finally(() => setIsSending(false))
		setDestinationString('')
		setDaiHrdToSendString('')
	}

	return <article style={{ display: 'flex', flexDirection: 'column', padding: '25px', backgroundColor: '#222632', borderRadius: '4px', ...model.style }}>
		<header style={{ fontFamily: 'Open Sans', fontStyle: 'normal', fontWeight: 600, fontSize: '16px', lineHeight: '22px', display: 'flex', alignItems: 'center', color: '#F3F3F3' }}>
			Send DAI-HRD
		</header>
		<span style={{ fontFamily: 'Open Sans', fontStyle: 'normal', fontWeight: 'normal', fontSize: '14px', lineHeight: '19px', color: '#F3F3F3', flexGrow: 1 }}>
			{bigintDaiToDecimalString(model.attodaiHrdBalance, 3)} DAI-HRD
		</span>
		<div style={{ height: '15px' }}></div>
		{isSending && <>
			<SpinnerPanel style={{ height: '150px' }}/>
		</>}
		{!isSending && <>
			<input style={{ height: '36px', padding: '0px 5px 0px 5px', flexGrow: 1, background: '#FFFFFF', borderRadius: '4px', fontFamily: 'Open Sans', fontStyle: 'normal', fontWeight: 'normal', fontSize: '14px', borderColor: (destination !== undefined || destinationString === '') ? 'transparent' : 'red', borderWidth: '2px', borderStyle: 'solid' }} type='text' placeholder='Destination: 0xadd12e55add12e55add12e55add12e55add12e55' onChange={event => setDestinationString(event.target.value)} value={destinationString}/>
			<div style={{ height: '15px' }}></div>
			<div style={{ display: 'flex', flexDirection: 'row', gap: '12px', height: '40px' }}>
				<input style={{ height: '40px', border: '0px', padding: '0px 5px 0px 5px', flexGrow: 1, background: '#FFFFFF', borderRadius: '4px', fontFamily: 'Open Sans', fontStyle: 'normal', fontWeight: 'normal', fontSize: '14px' }} type='text' placeholder='DAI-HRD to send: 9.97' onChange={event => setDaiHrdToSendString(event.target.value)} value={daiHrdToSendString}/>
				<div onClick={() => setDaiHrdToSendString(bigintDaiToDecimalString(model.attodaiHrdBalance))} style={{ height: 'inherit', width: '75px', background: '#00C3C2', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
					<div style={{ fontFamily: 'Open Sans', fontStyle: 'normal', fontWeight: 800, fontSize: '14px', lineHeight: '19px', display: 'flex', alignItems: 'center', textTransform: 'uppercase', color: '#FFFFFF' }}>
						Max
					</div>
				</div>
			</div>
			<div style={{ height: '15px' }}></div>
			{attodaiHrdToSend
				? <div onClick={sendClicked} style={{ height: '40px', width: '100%', background: '#00C3C2', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
					<div style={{ fontFamily: 'Open Sans', fontStyle: 'normal', fontWeight: 800, fontSize: '14px', lineHeight: '19px', display: 'flex', alignItems: 'center', textTransform: 'uppercase', color: '#FFFFFF' }}>
						Send DAI-HRD
					</div>
				</div>
				: <div style={{ height: '40px' }}></div>
			}
		</>}
	</article>
}
