import { useObservable, useObservableState } from 'observable-hooks'
import { useCallback, useEffect, useState } from 'react'
import { Observable } from 'rxjs'

export function useRefreshEvery(intervalMs: number) {
    const [_, update] = useState({})
    const forceUpdate = useCallback(() => update({}), [])

    useEffect(() => {
        const intervalId = setInterval(forceUpdate, intervalMs)
        return () => {
            clearInterval(intervalId)
        }
    }, [])
}

// TODO: if I decide to keep this, move it somewhere else
// TODO: naming? what makes this simpler is no need for inputs and dependency arrays...
export function usePipeObservableState<T>(init: () => Observable<T>, initialState: T): T {
    const state$ = useObservable(init, [])
    const state = useObservableState(state$, initialState)

    return state;
}
