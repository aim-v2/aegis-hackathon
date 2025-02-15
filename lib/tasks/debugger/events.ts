export type DispatchMouseEvent = {
    type: 'mousePressed' | 'mouseReleased' | 'mouseMoved' | 'mouseWheel'
    modifiers?: (
        1 // Alt
        | 2  // Ctrl
        | 4 // Meta/Command
        | 8 // Shift
    )
    timestamp?: number
    x: number
    y: number
    button?: 'none' | 'left' | 'middle' | 'right' | 'back' | 'forward'
    buttons?: (
        0 // None
        | 1 // Left
        | 2  // Right
        | 4 // Middle
        | 8 // Back
        | 16 // Forward
    )
    clickCount?: number // integer
    pointerType?: 'mouse' | 'pen'
    // a couple of experimental ones as well
}

export type DispatchKeyEvent = {
    type: 'keyDown' | 'keyUp' | 'rawKeyDown' | 'char'
    modifiers?: (
        1 // Alt
        | 2  // Ctrl
        | 4 // Meta/Command
        | 8 // Shift
    )
    timestamp?: number

    // TODO: not required for 'keyUp' and 'rawKeyDown'
    text?: string
    // TODO: do other fields
}
