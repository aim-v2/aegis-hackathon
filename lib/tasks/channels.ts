import { Option, Result } from 'ts-results-es'
import { Observable, fromEventPattern } from 'rxjs'
import { filter, mergeMap } from 'rxjs/operators'

import { parseFilter } from '@/lib/frp'
import { ProcedureMessages } from '@/lib/tasks/procedures'


export type ChannelPayload<T> = [T, chrome.runtime.Port, (response: any) => void]

const connections$ = fromEventPattern<chrome.runtime.Port>(
    handler => {
        chrome.runtime.onConnect.addListener(handler)
    },
    handler => {
        chrome.runtime.onConnect.removeListener(handler)
    }
)

// it's more efficient than using .pipe(filter(...)) because it doesn't register unneeded handlers
const filterPorts = <Message>(filter: (port: chrome.runtime.Port) => boolean) => {
    return (port: chrome.runtime.Port) => {
        return fromEventPattern<ChannelPayload<Message>>(
            handler => {
                if (filter(port)) {
                    port.onMessage.addListener(handler)
                }
            },
            handler => {
                if (filter(port)) {
                    port.onMessage.removeListener(handler)
                }
            }
        );
    }
}

export function eavesdrop<Message>(
    filter: (p: chrome.runtime.Port) => boolean
): Observable<ChannelPayload<Message>> {
    // TODO: I can't remember if this is right or should be switchMap instead
    return connections$.pipe(mergeMap(filterPorts<Message>(filter)))
}

export function channel<Message>(name: string): Observable<ChannelPayload<Message>> {
    return eavesdrop<Message>(port => port.name == name)
}

type ChromeMessageListener = (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
) => void;

// TODO: rename this type? since it's not from chrome, even though it's about the chrome runtime
export type ChromeMessageEvent<M = unknown> = {
    async: boolean
    message: M,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void,
}

export const messages$ = fromEventPattern<ChromeMessageEvent>(
    handler => {
        // TODO: refactor this shit it's buggy asf with observables
        const listener: ChromeMessageListener = (message, sender, sendResponse) => {
            const event: ChromeMessageEvent = {
                async: 'async' in message ? message.async : true,
                message,
                sender,
                sendResponse
            }

            if ('async' in message) {
                delete message.async
            }

            handler(event)

            // TODO: consider removing this entirely
            // README: handler needs to mutate event in order to control this
            return event.async
        }

        chrome.runtime.onMessage.addListener(listener)

        return listener
    },
    (_, listener) => {
        chrome.runtime.onMessage.removeListener(listener)
    },
)

export function tab(tabId: number) {
    return messages$.pipe(filter(({ sender }) => sender.tab?.id == tabId))
}

// TODO: maybe couple this with a concrete object?
export function sendControllerMessage<PM extends ProcedureMessages<string>>(): (
    <Type extends keyof PM>(message: PM[Type]['request']) => Promise<Result<PM[Type]['response'], string>>
) {
    return async message => {
        console.log('enviando mensagem chrome runtime', message)
        const response = await chrome.runtime.sendMessage(message)
        console.log('recebendo resposta chrome runtime', response)
        return response
    }
}

export function messages<M>(parseMessage: (x: unknown) => Option<M>): Observable<ChromeMessageEvent<M>> {
    return messages$.pipe(
        parseFilter(event => {
            return parseMessage(event.message).map(message => ({ ...event, message }))
        }),
    )
}

