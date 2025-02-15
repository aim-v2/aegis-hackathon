import { z } from 'zod'

import { parseSchema } from '@/lib/frp'
import { Extending, brandedEntries } from '@/lib/fn'
import { sendDebuggerCommand } from './commands'
import { ProcedureMessages, Procedures } from '../procedures'
import { Task } from '../task'


export const debuggerSessionMessageSchema = z.object({
    type: z.literal('debugger-session'),
    on: z.boolean(),
});

export type DebuggerSessionMessage = z.infer<typeof debuggerSessionMessageSchema>;

export const debuggerCommandsMessageSchema = z.object({
    type: z.literal('debugger-commands'),
    commands: z.object({
        method: z.string(),
        params: z
            .object({})
            .passthrough()
    }).array()
})

export type DebuggerCommandsMessage = z.infer<typeof debuggerCommandsMessageSchema>;

export type DebuggerMessageTypes = (DebuggerSessionMessage | DebuggerCommandsMessage)['type']

export type DebuggerMessages = Extending<
    ProcedureMessages<DebuggerMessageTypes>,
    {
        'debugger-session': {
            request: DebuggerSessionMessage,
            response: 'ok',
        },
        'debugger-commands': {
            request: DebuggerCommandsMessage,
            response: 'ok'
        },
    }
>;

export type DebuggerProcedures = Procedures<DebuggerMessageTypes, DebuggerMessages>;

export const DEBUGGER_PROCEDURES: DebuggerProcedures = {
    'debugger-session': {
        parser: parseSchema(debuggerSessionMessageSchema),
        handler: async (message, sender) => {
            const target = { tabId: sender.tab?.id }

            if (message.on) {
                await chrome.debugger.attach(target, '1.2');
            } else {
                await chrome.debugger.detach(target)
            }

            return { ok: 'ok' };
        }
    },

    'debugger-commands': {
        parser: parseSchema(debuggerCommandsMessageSchema),
        handler: async (message, sender) => {
            const target = { tabId: sender.tab?.id! }

            for (const command of message.commands) {
                await sendDebuggerCommand(
                    target,
                    command.method,
                    command.params
                );
            }

            return { ok: 'ok' };
        }
    },
};

export const subscribeDebuggerProcedures = (task: Task) => {
    for (const [type, ph] of brandedEntries(DEBUGGER_PROCEDURES)) {
        task.subscribeProcedureHandler<
            typeof type,
            DebuggerMessages,
            DebuggerProcedures
        >(type, ph);
    }
}
