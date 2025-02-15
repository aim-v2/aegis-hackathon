import { Option } from 'ts-results-es'

import { Result } from '../fn'


export type ProcedureRequest<Type extends string> = { type: Type }

export type ProcedureMessages<Types extends string> = {
    [T in Types]: {
        request: ProcedureRequest<T>,
        response: any
    }
}

export type Procedure<
    Type extends string,
    Request extends { type: Type } = { type: Type } & any,
    Response = {} & any,
> = {
    parser: (x: unknown) => Option<Request>
    handler: (
        message: Request,
        sender: chrome.runtime.MessageSender
    ) => Promise<Result<Response>>
}

// TODO: review naming (it's hard and in the end I opted for the shortest form (i.e. x | xs))
// TODO: I wish there was a way to infer Types (since it's just keyof) but I've failed to find it
export type Procedures<
    Types extends string,
    M extends ProcedureMessages<Types>
> = {
        [T in Types]: M[T]['request'] extends ProcedureRequest<T>
        ? Procedure<T, M[T]['request'], M[T]['response']>
        : never
    }