export interface ModalModel {
	onClose: () => void
	content: string | JSX.Element
}

export function Modal(model: ModalModel) {
	return <div>
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, textAlign: 'center', backgroundColor: 'rgba(0,0,0,.4)' }} onClick={model.onClose}>
			<div style={{ position: 'relative', maxWidth: '400px', height: '100vi', backgroundColor: '#ffffff', borderRadius: '4px', padding: '15px', margin: '15px' }} onClick={event => {event.preventDefault(); event.stopPropagation()}}>
				<img style={{ position: 'absolute', right: '10px', top: '10px' }} onClick={model.onClose} src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQfjCw4MLQIMNUcJAAAAgElEQVQoz4WR0RGEIAxEnxYkzGgz2DVcF0dOS8APwEFALn+bTTabBHZ+OBR1KByCASEQEPSD1in/BUdoSjIdsKBukEt0kVFxmk+Jg61CjaQ0erfn3Je713Yt36Nn+jGN+iuDkR6aLBdbC3RGleXfoT7DUzuS4NuzPBgE2323RTAXftOBRIRYTscAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTktMTEtMTRUMTI6NDU6MDIrMDA6MDAJPNwHAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE5LTExLTE0VDEyOjQ1OjAyKzAwOjAweGFkuwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAAASUVORK5CYII='/>
				<div style={{ padding: '15px' }}>
					{model.content}
				</div>
			</div>
		</div>
	</div>
}
