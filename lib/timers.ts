export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export const jitter = (mean: number, std: number) => {
    return mean + (2 * Math.random() - 1) * std
}
