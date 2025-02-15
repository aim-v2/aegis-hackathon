import { Option } from 'ts-results-es'

export const uniqueFilter = <T>(value: T, index: number, self: T[]) => self.indexOf(value) == index;

// TODO: reconsider the name, but also avoid conflict with chrome-types Entry
export type BrandedEntry<T> = { [K in keyof Required<T>]: [K, T[K]] }[keyof T];

export function brandedEntries<T>(object: T): BrandedEntry<T>[] {
    return Object.entries(object as any) as any;
}

// FIXME: this is misleading because it doesn't assert that all required entries are present
export function fromBrandedEntries<T>(entries: BrandedEntry<T>[]): T {
    return Object.fromEntries(entries) as any;
}

export type BrandedFilter<U, V> = <Entry extends BrandedEntry<U>>(entry: Entry) => (
    IsEntry<Entry, V>
);

export function brandedFilter<U, V>(entries: BrandedEntry<U>[], filter: BrandedFilter<U, V>): BrandedEntry<V>[] {
    // TODO: try to make this stricter
    return entries.filter(filter) as unknown as BrandedEntry<V>[];
}

export type Extends<A, B> = A extends B ? true : false;

export type IsEntry<U, V> = Extends<U, BrandedEntry<V>>;

export type BrandedAction<U, V> = (entry: BrandedEntry<U>) => BrandedEntry<V>;

export function brandedAction<U, V>(entries: BrandedEntry<U>[], action: BrandedAction<U, V>): BrandedEntry<V>[] {
    return entries.map(action)
}

// TODO: finish this
export type BrandedImage<U, I, V extends Record<keyof U, I>> = {
    [K in keyof (U | V)]: V[K]
}

// TODO: fix this, it's not inferring properly
export function liftAction<U, V>(
    action: (val: U[keyof U]) => V[keyof V]
): BrandedAction<U, Record<keyof U, V[keyof V]>> {
    return ([key, value]) => [key, action(value)];
}

/* TODO: also create a function that lifts a map U -> V to an action in their entries
 * this only works if they have the same keys, so we have to find a slick way of
 * imposing this restriction in the generics system
 */
export function conjugateEntries<U, V>(obj: U, action: BrandedAction<U, V>): V {
    return fromBrandedEntries(brandedEntries(obj).map(action));
}

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
export type ExpandRecursively<T> = T extends object
    ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
    : T;

export type ExpandUntil<T, U> = (
    T extends object
    ? (
        T extends infer O
        ? (
            {
                [K in keyof O]: (
                    O[K] extends U
                    ? O[K]
                    : ExpandUntil<O[K], U>
                )
            }
        )
        : never
    )
    : T
);


type MappedC<A, B> = {
    [K in keyof A & keyof B]:
    A[K] extends B[K]
    ? never
    : K
};

export type OptionalKeys<T> = MappedC<T, Required<T>>[keyof T];
export type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

export type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];
export type DefinedKeys<T> = Exclude<KeysOfType<T, Exclude<T[keyof T], undefined>>, undefined>;
export type UndefinedKeys<T> = Exclude<keyof T, DefinedKeys<T>>;

export type OptionalToUndefined<T> = (
    (Pick<T, RequiredKeys<T>>)
    & ({ [K in OptionalKeys<T>]: Required<T>[K] | undefined })
);

// TODO: already got rid of Option might as well get rid of this
// TODO: try to get back some type inference (i.e. when no error ok exists)
// TODO: keep this alignment style for multiline operations? lol
export type Result<Value, Error = any> = (
    { ok: Value, err?: never } |
    { ok?: never, err: Error }
)

export type Unwrap<T> = (
    T extends Option<infer V>
    ? V
    : T extends Result<infer V>
    ? V
    : never
);

export function unwrap<T>(wrapped: Result<T> | Option<T>): T {
    if ('ok' in wrapped) {
        return wrapped.ok!
    }

    if ('err' in wrapped) {
        // TODO: think about error serialization and stuff
        throw `tried to unwrap error value: ${wrapped.err}`
    }

    if (wrapped.isSome()) {
        return wrapped.value
    }

    throw `tried to unwrap None`
}

export type Extending<P, Q extends P> = Q;
