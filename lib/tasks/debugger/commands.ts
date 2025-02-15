import { DispatchKeyEvent, DispatchMouseEvent } from './events';


export type MouseCommand = {
    method: 'Input.dispatchMouseEvent',
    params: DispatchMouseEvent
}

export function clickCommands(element: HTMLElement): MouseCommand[] {
    const { x, y, height, width } = element.getBoundingClientRect();

    const pressedX = x + Math.random() * width;
    const pressedY = y + Math.random() * height;

    return [
        {
            method: 'Input.dispatchMouseEvent',
            params: {
                type: 'mousePressed',
                x: pressedX,
                y: pressedY,
                button: 'left',
                buttons: 1,
                clickCount: 1,
                pointerType: 'mouse',
                timestamp: Date.now() + 2
            },
        },
        {
            method: 'Input.dispatchMouseEvent',
            params: {
                type: 'mouseReleased',
                x: pressedX,
                y: pressedY,
                button: 'left',
                buttons: 1,
                clickCount: 1,
                pointerType: 'mouse',
                timestamp: Date.now() + 3
            },
        }
    ]
}

export type KeyCommand = {
    method: 'Input.dispatchKeyEvent',
    params: DispatchKeyEvent
}

export function typingCommands(text: string): KeyCommand[] {
    return text.split('').flatMap<KeyCommand>((char, index) => [
        {
            method: 'Input.dispatchKeyEvent',
            params: {
                type: 'keyDown',
                text: char,
                key: char,
                timestamp: Date.now() + index + 2
            }
        },
        {
            method: 'Input.dispatchKeyEvent',
            params: {
                type: 'keyUp',
                key: char,
                timestamp: Date.now() + index + 3
            }
        },
    ]);
}

// TODO: other targets?
type DebuggerTarget = { tabId: number }

// TODO: type-completion <Command extends MouseCommand | KeyCommand>
export async function sendDebuggerCommand(
    target: DebuggerTarget,
    method: string,
    params: {}
): Promise<{}> {
    return chrome.debugger.sendCommand(target, method, params);
}
