export const chatTemplate = `<div id="chat-container">
    <div id="safety-score">
        <span class="score-label">Rules Safety Score:</span>
        <span class="score-value">%</span>
    </div>
    <div id="messages-area"></div>
    <div id="suggestion-area">
        <button class="suggestion-button" data-suggestion="What are the potential risks involved in this bet?">Risks?</button>
        <button class="suggestion-button" data-suggestion="Can you help me understand the probability of different outcomes?">Probability?</button>
        <button class="suggestion-button" data-suggestion="How were the rules analyzed to result in the safety score?">Risk Score?</button>
    </div>
    <div id="input-area">
        <textarea 
            id="message-input" 
            placeholder="Type your message here..."
            rows="3"
        ></textarea>
        <button id="send-button" class="initial-load">Send</button>
    </div>
</div>`;