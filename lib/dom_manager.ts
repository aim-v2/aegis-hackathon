import { chatTemplate } from '../style/chatTemplate';
import { chatStyles } from '../style/chatStyles';

import { ScoreData } from '../lib/messaging'

export class DOMManager {
    static async setupChatInterface(parentNode: HTMLElement): Promise<{
        messageInput: HTMLTextAreaElement;
        sendButton: HTMLButtonElement;
        messagesArea: HTMLDivElement;
    }> {
        const chatContainer = await this.createChatContainer();
        await this.addStyles();
        this.addStatusStyles();
        parentNode.appendChild(chatContainer);

        const messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
        const sendButton = document.getElementById('send-button') as HTMLButtonElement;
        const messagesArea = document.getElementById('messages-area') as HTMLDivElement;

        if (!messageInput || !sendButton || !messagesArea) {
            throw new Error('Failed to initialize chat interface: Required elements not found');
        }

        return { messageInput, sendButton, messagesArea };
    }
    
    private static async createChatContainer(): Promise<HTMLDivElement> {
        const chatContainer = document.createElement('div');
        chatContainer.innerHTML = chatTemplate;
        return chatContainer;
    }

    private static async addStyles(): Promise<void> {
        const style = document.createElement('style');
        style.textContent = chatStyles;
        document.head.appendChild(style);
    }

    static addMessage(
        messagesArea: HTMLDivElement, 
        text: string, 
        isUser = false, 
        isLoading = false
    ): HTMLDivElement {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (!isUser && !isLoading) {
            this.formatAIMessage(contentDiv, text);
        } else {
            contentDiv.textContent = text;
        }
        
        messageDiv.appendChild(contentDiv);
        messagesArea.appendChild(messageDiv);
        
        this.scrollToBottom(messagesArea);
        return messageDiv;
    }

    static showError(inputArea: HTMLElement, message: string): void {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = message;
        
        inputArea.appendChild(errorMsg);

        setTimeout(() => {
            errorMsg.style.animation = 'errorSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            setTimeout(() => errorMsg.remove(), 300);
        }, 3000);
    }

    static async setupSafetyScore(scoreData: ScoreData): Promise<void> {
        try {            
            this.updateSafetyScoreUI(scoreData.score, scoreData.from_blockchain);
        
        } catch (error) {
            console.error('Error setting up safety score:', error);
            this.updateSafetyScoreUI(-1, false);
        }
    }

    private static updateSafetyScoreUI(score: number, isFromBlockchain: boolean): void {
        const scoreElement = document.querySelector('.score-value') as HTMLElement;        
        const statusElement = document.querySelector('.status-text') as HTMLElement;
        
        this.updateScoreDisplay(scoreElement, score);
        this.updateStatusText(statusElement, isFromBlockchain);
    }

    static setScoreLoading(): void {
        const scoreElement = document.querySelector('.score-value') as HTMLElement;
        const scoreContainer = document.getElementById('safety-score');
        const existingStatus = scoreContainer?.querySelector('.status-text');

        if (existingStatus) {
            existingStatus.remove();
        }

        const statusText = document.createElement('div');
        statusText.className = 'status-text loading';
        scoreContainer?.appendChild(statusText);

        statusText.innerHTML = `
            <div class="status-content">
                <span>Trying to fetch from blockchain</span>
                <div class="loading-dots">
                    <span>.</span><span>.</span><span>.</span>
                </div>
                <div class="loading-spinner"></div>
            </div>
        `;

        scoreElement.textContent = '—';
        scoreElement.style.backgroundColor = '#94a3b8';
    }

    private static updateScoreDisplay(scoreElement: HTMLElement, score: number): void {
        scoreElement.textContent = `${score}%`;
        this.updateScoreColor(scoreElement, score);
        this.animateScoreChange(scoreElement);
    }

    private static updateScoreColor(element: HTMLElement, score: number): void {
        const color = score >= 85 ? '#22c55e' : 
                     score >= 50 ? '#eab308' : 
                     '#ef4444';
        element.style.backgroundColor = color;
    }

    private static updateStatusText(statusElement: HTMLElement, isFromBlockchain: boolean): void {
        statusElement.innerHTML = '';
        statusElement.className = 'status-text'; 

        if (isFromBlockchain) {
            statusElement.innerHTML = `
                <div class="status-content success">
                    <span>Fetched from blockchain</span>
                    <span class="emoji">✅</span>
                </div>
            `;
            statusElement.classList.add('success');
        } else {
            statusElement.innerHTML = `
                <div class="status-content calculate">
                    <span>Calculating new score</span>
                    <div class="calculate-animation">
                        <span class="emoji">🔄</span>
                    </div>
                </div>
            `;
            statusElement.classList.add('calculating');

            setTimeout(() => {
                statusElement.innerHTML = `
                    <div class="status-content saving">
                        <span>Saving to blockchain</span>
                        <span class="emoji">💾</span>
                    </div>
                `;
                statusElement.classList.remove('calculating');
                statusElement.classList.add('saving');

                setTimeout(() => {
                    statusElement.innerHTML = `
                        <div class="status-content saved">
                            <span>Saved to blockchain!</span>
                            <span class="emoji">✨</span>
                        </div>
                    `;
                    statusElement.classList.remove('saving');
                    statusElement.classList.add('saved');
                }, 1500);
            }, 1000);
        }
    }

    private static addStatusStyles(): void {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .status-text {
                font-size: 0.875rem;
                transition: all 0.3s ease;
                margin-top: 0.5rem;
            }

            .status-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                animation: fadeIn 0.3s ease-in-out;
            }

            .loading .status-content {
                color: #2563eb;
            }

            .loading-dots {
                display: inline-flex;
            }

            .loading-dots span {
                animation: loadingDots 1.4s infinite;
                opacity: 0;
            }

            .loading-dots span:nth-child(1) { animation-delay: 0s; }
            .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
            .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #2563eb;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-left: 0.5rem;
            }

            .success .status-content {
                color: #22c55e;
            }

            .calculating .status-content {
                color: #6b7280;
            }

            .calculate-animation .emoji {
                display: inline-block;
                animation: rotate 1s linear infinite;
            }

            .saving .status-content {
                color: #2563eb;
            }

            .saved .status-content {
                color: #22c55e;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes loadingDots {
                0%, 80%, 100% { opacity: 0; }
                40% { opacity: 1; }
            }

            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    private static animateScoreChange(element: HTMLElement): void {
        element.classList.add('animate');
        setTimeout(() => {
            element.classList.remove('animate');
        }, 400);
    }

    private static formatAIMessage(contentDiv: HTMLDivElement, text: string): void {
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
            const title = lines[0].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            const points = lines
                .slice(1)
                .filter(line => line.startsWith('-'))
                .map(point => {
                    const [label, ...content] = point.substring(1).split(':');
                    return {
                        label: label.trim(),
                        content: content.join(':').trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    };
                });
    
            contentDiv.innerHTML = `
                <div class="message-title">
                    ${title.trim()}
                </div>
                <ul class="message-points">
                    ${points.map(point => `
                        <li>
                            <strong style="color: #0066cc">${point.label}:</strong> ${point.content}
                        </li>
                    `).join('')}
                </ul>
            `;
        } else {
            contentDiv.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
    }
    

    private static scrollToBottom(element: HTMLElement): void {
        element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
        });
    }
}