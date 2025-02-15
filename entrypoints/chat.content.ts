import { snapshotSchema } from "@/lib/scraping/schema"
import { sendMessage } from '../lib/messaging';
import { DOMManager } from '../lib/dom_manager';
import { sleep } from "@/lib/timers"

type PolyMarketSnapshot = ReturnType<typeof snapshotSchema<typeof POLYMARKET_SCHEMA>>

const POLL_RATE = 5_000
const POLYMARKET_SCHEMA = {
    politicsMarkets: [{
        path: `//div[@data-swipeable='true' and not(@aria-hidden='true')]/div/div/div`,
        node: true,
        children: {
            event: [{
                path: `.//a[starts-with(@href,"/event")]`,
                node: true,
            }]
        }
    }],
    cryptoMarkets: {
        path: `//div[@id='markets-grid-container']`,
        node: true,
        children: {
            markets: [{
                path: `./div`,
                node: true,
                children: {
                    link: {
                        path: `.//a[starts-with(@href, '/event/') and not(contains(substring-after(@href, '/event/'), '/'))]/p`,
                        node: true,
                    },
                    title: {
                        path: `.//a[starts-with(@href, '/event/') and not(contains(substring-after(@href, '/event/'), '/'))]/p`,
                        value: 'innerText'
                    },
                    no: [{
                        path: `.//button[contains(@class, 'c-hiJGYH') and contains(., 'Buy No')]`,
                        node: true
                    }],
                    yes: [{
                        path: `.//button[contains(@class, 'c-hiJGYH') and contains(., 'Buy Yes')]`,
                        node: true
                    }],
                    odds: [{
                        path: `.//div[contains(@class, 'c-dhzjXW-ibbcBtJ-css')]//p[contains(@class, 'c-dqzIym') and contains(text(), '%')]`,
                        value: 'innerText'
                    }],
                    bets: [{
                        path: `.//div[./div/a[starts-with(@href, '/event/') and contains(substring-after(@href, '/event/'), '/')]]`,
                        children: {
                            option: {
                                path: `./div/a/p`,
                                value: 'innerText'
                            },
                            odds: {
                                path: `./div/p`,
                                value: 'innerText'
                            },
                            yes: {
                                path: `./div/button[./span[contains(text(), 'Yes')]]`,
                                node: true
                            },
                            no: {
                                path: `./div/button[./span[contains(text(), 'No')]]`,
                                node: true
                            }
                        }
                    }]
                }
            }]
        }
    },
    betPage: {
        path: `//div[@id='trade-widget']/div`,
        node: true,
        children: {
            title: {
                path: `//h1[@class="c-iFnLRI c-krCCTZ c-iFnLRI-eHbKxH-variant-primary"]`,
                value: "innerText",
            },

            description: [{
                path: `//div[@id='event-detail-container']/div/div[contains(@class, 'c-hakyQ')]/div[contains(@class, 'c-hakyQ')]/div[contains(@class, 'c-hakyQ')]/div[contains(@class, 'c-dhzjXW')]/text()[normalize-space()]`,
                value: "textContent"
            }]
        }
    }
} as const


function getBetId(): number | null {
    const match = window.location.toString().match(/[?&]tid=(\d+)/);
    return match ? Number(match[1]) : null;
}

class ChatInterface {
    private messageInput!: HTMLTextAreaElement;
    private sendButton!: HTMLButtonElement;
    private messagesArea!: HTMLDivElement;
    private title!: string;
    private betRules!: string;

    constructor(snapshot: PolyMarketSnapshot) {
        this.initializeChat(snapshot);
    }

    private async initializeChat(snapshot: PolyMarketSnapshot): Promise<void> {
        if (!this.canInitialize(snapshot)) {
            return;
        }

        await this.setupChat(snapshot);
        this.setupEventListeners();
        await Promise.all([this.initializeSafetyScore(), this.handleInitialMessage()])
    }

    private canInitialize(snapshot: PolyMarketSnapshot): boolean {
        if (!snapshot.betPage.node) {
            return false;
        }

        if (snapshot.betPage.node.querySelector('#chat-container')) {
            return false;
        }

        return true;
    }

    private async setupChat(snapshot: PolyMarketSnapshot): Promise<void> {
        const elements = await DOMManager.setupChatInterface(snapshot.betPage.node);

        this.messageInput = elements.messageInput;
        this.sendButton = elements.sendButton;
        this.messagesArea = elements.messagesArea;

        const paragraphTexts = snapshot.betPage.children.description.map((p) => p.value);
        this.betRules = paragraphTexts.join('\n');
        this.title = snapshot.betPage.children.title.value || '';
    }

    private async initializeSafetyScore(): Promise<void> {
        let id = getBetId()
        id = id ? id : -1

        const scoreData = await sendMessage("get_safety_score", {
            name: this.title,
            rules: this.betRules,
            uuid: id
        });

        console.log(scoreData)
        DOMManager.setScoreLoading()
        await DOMManager.setupSafetyScore(scoreData);
    }

    private setupEventListeners(): void {
        this.setupSuggestionButtons();
        this.setupMessageInput();
        this.setupSendButton();
    }

    private setupSuggestionButtons(): void {
        const suggestionButtons = document.querySelectorAll('.suggestion-button');
        suggestionButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const suggestion = (button as HTMLElement).dataset.suggestion;
                if (suggestion && this.messageInput) {
                    this.messageInput.value = suggestion;
                    this.messageInput.focus();
                    await this.handleSend();
                }
            });
        });
    }

    private setupMessageInput(): void {
        this.messageInput.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
    }

    private setupSendButton(): void {
        this.sendButton.addEventListener('click', () => this.handleSend());
    }

    private async handleSend(): Promise<void> {
        const text = this.messageInput.value.trim();

        if (!this.validateMessage(text)) {
            return;
        }

        this.toggleSendButton(true);

        if (text) {
            DOMManager.addMessage(this.messagesArea, text, true);
            this.messageInput.value = '';
        }

        const loadingMessage = DOMManager.addMessage(this.messagesArea, 'Loading...', false, true);

        try {
            const response = await this.sendMessageToAI(text);
            loadingMessage.remove();

            if (response) {
                DOMManager.addMessage(this.messagesArea, response, false);
            } else {
                DOMManager.addMessage(this.messagesArea, 'Error: No response received', false, true);
            }
        } catch (error) {
            loadingMessage.remove();
            DOMManager.addMessage(
                this.messagesArea,
                `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                false,
                true
            );
        } finally {
            this.toggleSendButton(false);
        }
    }

    private validateMessage(text: string): boolean {
        if (!text && this.messagesArea.childNodes.length > 0) {
            const inputArea = document.getElementById('input-area');
            if (inputArea) {
                DOMManager.showError(inputArea, 'Please enter a message');
            }
            return false;
        }
        return true;
    }

    private toggleSendButton(disabled: boolean): void {
        if (this.sendButton) {
            this.sendButton.disabled = disabled;
            if (disabled) {
                this.sendButton.classList.add('animate-send');
            } else {
                this.sendButton.classList.remove('animate-send');
            }
        }
    }

    private async handleInitialMessage(): Promise<void> {
        try {
            const response = await sendMessage('talk_to_ai', {
                name: this.title,
                rules: this.betRules,
                user_msg: ''
            });

            if (response) {
                DOMManager.addMessage(this.messagesArea, response, false);
            } else {
                DOMManager.addMessage(this.messagesArea, 'Error: No initial response received', false, true);
            }
        } catch (error) {
            DOMManager.addMessage(
                this.messagesArea,
                `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                false,
                true
            );
        }
    }

    private async sendMessageToAI(text: string): Promise<any> {
        return await sendMessage('talk_to_ai', {
            name: this.title,
            rules: this.betRules,
            user_msg: text
        });
    }
}


export default defineContentScript({
    matches: ["*://polymarket.com/*"],
    async main() {

        while (true) {
            await sleep(POLL_RATE);

            try {
                const snapshot = snapshotSchema(POLYMARKET_SCHEMA);
                const existingChat = document.querySelector('#chat-container');
                if (snapshot.betPage.node && !existingChat) {
                    new ChatInterface(snapshot);
                }
            } catch {
                continue
            }
        }
    },
});