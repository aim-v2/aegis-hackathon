import { BehaviorSubject, Observable } from 'rxjs'
import { Option } from 'ts-results-es'

import {  debounceTime, distinctUntilChanged, filter, first, mergeMap, skip, switchMap, takeUntil, tap, windowToggle } from 'rxjs/operators'
import { z } from 'zod'
import { Result } from '@/lib/fn'
import { parseFilter, parseSchema } from '@/lib/frp'
import { persistError, persistInfo, persistPanic, persistWarning } from '@/lib/log'
import { ChromeMessageEvent, tab } from '@/lib/tasks/channels'
import { ProcedureMessages, Procedures } from '@/lib/tasks/procedures'


const HEARTBEAT_POLLING_MS = 1_000;

const heartbeatSchema = z.object({ type: z.literal('heartbeat') })
const parseHeartbeat = parseSchema(heartbeatSchema)
type HeartbeatMessage = { type: 'heartbeat' }

export type TaskSkeleton = {
    id: string
    url: string
    name: string
    script: string
};

export class Task<ScriptMessages extends ProcedureMessages<string> = {}> {
    id: string;
    url: string;
    name: string;
    script: string;

    tabId?: number;

    private alive: BehaviorSubject<boolean> = new BehaviorSubject(false);
    // TODO: pipe distinctUntilChanged() here (have to refactor died and spawned)
    alive$ = this.alive.asObservable();

    private procedureHandlers: Set<string> = new Set()

    constructor(skelly: TaskSkeleton) {
        this.id = skelly.id;
        this.url = skelly.url;
        this.name = skelly.name;
        this.script = skelly.script;
    }

    // TODO: public or private?
    private messages<M>(parseMessage: (x: unknown) => Option<M>): Observable<ChromeMessageEvent<M>> {
        // TODO: this could basically be toggle if tabId was an observable
        return tab(this.tabId!).pipe(
            parseFilter(event => {
                const parseResult = parseMessage(event.message)
                if (
                    parseResult.isSome()
                    && typeof event.message === 'object'
                    && event.message !== null
                    && 'type' in event.message
                    && event.message.type !== 'heartbeat'
                ) {
                    console.log({ event, parseResult })
                }

                return parseMessage(event.message).map(message => ({ ...event, message }))
            }),
            takeUntil(this.died()),
            tap(m => console.debug('recebendo mensagem da task', this.id, m))
        )
    }

    private stethoscope = (): Observable<ChromeMessageEvent<HeartbeatMessage>> => {
        const heartbeat$ = this.messages(parseHeartbeat)

        heartbeat$.subscribe(event => event.sendResponse(true))

        heartbeat$.subscribe(() => console.debug('tum tum'))

        heartbeat$
            .pipe(
                debounceTime(3 * HEARTBEAT_POLLING_MS),
                takeUntil(this.died()),
                tap(() => persistError(this.id, `${this.id} lost`)),
                switchMap(this.kill),
                switchMap(this.spawn),
            )
            .subscribe(() => persistInfo(this.id, `${this.id} recovered`))

        return heartbeat$
    }

    public spawn = async (): Promise<void> => {
        // TODO: think about edge-case scenarios around tabId and alive being out-of-sync
        if (this.alive.value) {
            // TODO: eventually remove this warning
            persistWarning(this.id, {
                message: "tried to spawn alive task",
                data: {
                    alive: this.alive.value,
                    tabId: this.tabId,
                }
            })

            return
        }

        const tab = await chrome.tabs.create({ url: this.url })
        this.tabId = tab.id!

        return new Promise(resolve => (
            this
                .stethoscope()
                .pipe(first())
                .subscribe(() => {
                    console.debug('marcando task como viva', this.id)
                    this.alive.next(true)
                    resolve()
                })
        ))
    }

    public kill = async (): Promise<void> => {
        console.warn('trying to kill task', this.id);

        if (!this.alive.value) {
            persistPanic(this.id, {
                message: "tried to kill dead task",
                data: {
                    alive: this.alive.value,
                    tabId: this.tabId,
                }
            });
        }

        if (this.tabId) {
            await chrome.tabs.remove(this.tabId).catch(err => {
                console.error('trying to kill tab', err);
            });
            this.tabId = undefined;
        }

        this.alive.next(false);
    }

    public destroy = async (): Promise<void> => {
        await this.kill();
        this.alive.complete();
    }

    public spawned = (): Observable<boolean> => {
        return this.alive$.pipe(skip(1), filter(alive => alive));
    }

    // TODO: change this to dead() (remove skip(1)) and rename spawned() as well
    public died = (): Observable<boolean> => {
        return this.alive$.pipe(
            skip(1),
            filter(alive => !alive),
            tap(() => console.debug('task died'))
        );
    }

    public toggle = <T>(source: Observable<T>): Observable<T> => {
        return this.alive$.pipe(
            distinctUntilChanged(),
            filter(alive => alive),
            // TODO: understand better if this is the right kind of map
            switchMap(() => source),
            windowToggle(
                this.alive$.pipe(filter(alive => alive)),
                () => this.alive$.pipe(filter(alive => !alive))
            ),
            mergeMap(x => x)
        );
    }

    // TODO: maybe this shouldn't have type parameters at all?
    public async sendMessage<Type extends string & keyof ScriptMessages>(
        message: ScriptMessages[Type]['request']
    ): Promise<Result<ScriptMessages[Type]['response']>> {
        console.debug('mandando mensagem', Date.now());

        if (!this.tabId) {
            persistPanic(this.id, {
                message: "tried to send message to an unavailable task",
                data: {
                    message,
                    alive: this.alive.value
                }
            });
        }

        // TODO: consider how to validate this dynamically
        return await chrome.tabs.sendMessage(
            this.tabId!,
            message
        );
    }

    public subscribeProcedureHandler<
        Type extends string,
        Messages extends ProcedureMessages<Type>,
        P extends Procedures<Type, Messages>,
    >(type: Type, ph: P[Type]) {
        if (this.procedureHandlers.has(type)) {
            persistPanic(this.id, {
                message: 'duplicate procedure handlers',
                handlers: this.procedureHandlers,
                type,
            })
        }

        this.procedureHandlers.add(type);

        this
            .spawned()
            .pipe(switchMap<
                boolean,
                Observable<ChromeMessageEvent<Messages[Type]['request']>>
            >(() => this.messages(ph.parser)))
            .subscribe(async event => {
                const { message, sender, sendResponse } = event;
                console.log('recebendo mensagem', message)
                try {
                    const response = await ph.handler(message, sender);
                    console.log('respondendo mensagem', response)
                    sendResponse(response);
                } catch (err) {
                    console.error('é o pegas, ele pegas errors', err);
                }
            });
    }
}
