export class ErrorHandler {
	// TODO: surface the error in the UI somewhere, perhaps an error toast
	public readonly noticeError = (error: any) => {
		if (error instanceof Error) {
			console.error(error)
		} else if (typeof error === 'string') {
			console.error(error)
		} else {
			console.error(error)
		}
	}

	public readonly asyncWrapper = <R, P extends any[]>(asyncFunction: (...args: P) => Promise<R>): (...args: P) => void => {
		return (...args: P) => {
			asyncFunction(...args).catch(this.noticeError)
		}
	}

	public readonly asyncCatcher = <R, P extends any[]>(asyncFunction: (...args: P) => Promise<R>): (...args: P) => Promise<R> => {
		return async (...args) => {
			const promise = asyncFunction(...args)
			promise.catch(this.noticeError)
			return await promise
		}
	}
}
