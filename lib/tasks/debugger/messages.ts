import { z } from 'zod';


export const debuggerSessionMessageSchema = z.object({
    type: z.literal('debugger-session'),
    on: z.boolean(),
});

export type DebuggerSessionMessage = z.infer<typeof debuggerSessionMessageSchema>;

export const debuggerCommandsMessageSchema = z.object({
    type: z.literal('debugger-command'),
    commands: z.object({
        method: z.string(),
        params: z
            .object({})
            .passthrough()
    }).array()
})

export type DebuggerCommandsMessage = z.infer<typeof debuggerCommandsMessageSchema>
