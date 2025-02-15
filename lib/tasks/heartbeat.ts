import { interval } from 'rxjs'


const HEARBEAT_REFRESH_RATE_MS = 1000;


// TODO: integrate this with new procedure framework somehow
export async function establishHeartbeatChannel() {
    interval(HEARBEAT_REFRESH_RATE_MS).subscribe(() => {
        chrome.runtime.sendMessage({ type: 'heartbeat' })
    })
}
