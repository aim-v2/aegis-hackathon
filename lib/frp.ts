import { Observable, OperatorFunction, defer, of, timer, EMPTY } from 'rxjs';
import { filter, retry, tap, switchMap, map } from 'rxjs/operators';
import { Option, None, Some } from 'ts-results-es'


type Operator<A, B> = (a: Observable<A>) => Observable<B>

export type ErrorContext = { id: string, data?: any }

// TODO: work on this
type ResultLike<T> = { ok?: T | undefined | false }

// README: a lot of this sucks and we should migrate to ts-results-es or something like that
// TODO: work on this
export type Logger = {
    info: (contextId: string, context: any) => void
    warn: (contextId: string, context: any) => void
    error: (contextId: string, context: any) => void
    panic: (contextId: string, context: any) => never
}

export function unwrapper(logger: Logger) {
    return <T>(context: ErrorContext): Operator<ResultLike<T>, T> => {
        return source => new Observable<T>((subscriber) => {
            source.subscribe({
                next(response) {
                    if (!response.ok) {
                        logger.panic(context.id, {
                            response,
                            data: context.data
                        })
                    }

                    subscriber.next(response.ok)
                },

                error(err) {
                    subscriber.error(err)
                },

                complete() {
                    subscriber.complete()
                }
            })

            // TODO: figure out if I really should omit this (it errors)
            // return subscription.unsubscribe
        })
    }
}

export function filterUnwrapper(logger: Logger) {
    return <T>(context: ErrorContext): Operator<ResultLike<T>, T> => {
        return source => (
            source.pipe(
                filter(result => {
                    if (!result.ok) {
                        logger.warn(context.id, {
                            result,
                            data: context.data
                        })
                        return false;
                    }

                    return true;
                }),
                unwrapper(logger)({
                    id: context.id,
                    data: {
                        message: 'error in filter-unwrap: should be unreachable',
                        data: context.data
                    }
                })
            )
        )
    }
}

export function bufferUntil<T>(emitWhen: (last: T) => boolean): OperatorFunction<T, T[]> {
    return (source: Observable<T>) => defer(() => {
        let buffer: T[] = [];
        return source.pipe(
            tap(v => buffer.push(v)),
            // TODO: maybe make this depend on the whole buffer?
            switchMap(() => emitWhen(buffer[buffer.length - 1]) ? of(buffer) : EMPTY),
            tap(() => buffer = [])
        )
    });
}

// TODO: naming? skipLesser, streamMax, something else...
export function filterMax<T>(gt: (a: T, b: T) => boolean): OperatorFunction<T, T> {
    return (source: Observable<T>) => defer(() => {
        let currentMax: T;

        return source.pipe(
            filter(next => gt(currentMax, next)),
            tap(next => currentMax = next)
        );
    });
}

// TODO: this is inefficient if timestamp is expensive. whatever
export function skipStale<T>(timestamp: (a: T) => number): OperatorFunction<T, T> {
    return filterMax<T>((a, b) => timestamp(a) > timestamp(b));
}

export function parseFilter<T, V>(parse: (x: T) => Option<V>): OperatorFunction<T, V> {
    return (source: Observable<T>) => defer(() => {
        return source.pipe(
            map(parse),
            filter(opt => opt.isSome()),
            map(opt => opt.value)
        )
    });
}

type SchemaSafeParse<T> = {
    safeParse(data: unknown): ({ success: true, data: T } | { success: false, error: unknown })
}

export function parseSchema<T>(schema: SchemaSafeParse<T>): (x: unknown) => Option<T> {
    return message => {
        const result = schema.safeParse(message);

        return result.success ? Some(result.data) : None
    }
}

export function backoff<T>(retries: number, delayMs: number): OperatorFunction<T, T> {
    return (source: Observable<T>) => source.pipe(
        retry({
            count: retries,
            delay: (_, count) => timer(delayMs ** count)
        }),
    )
}
