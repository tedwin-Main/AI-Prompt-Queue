// utils/claude-adapter.js

const ClaudeAdapter = {
    hostPattern: 'claude.ai',
    
    getInput: () => {
        return document.querySelector('div[contenteditable="true"]');
    },
    
    getSubmit: () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => {
            const label = b.getAttribute('aria-label') || '';
            return label.toLowerCase().includes('send message');
        });
    },
    
    isResponseComplete: () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const stopBtn = buttons.find(b => {
            const label = b.getAttribute('aria-label') || '';
            return label.toLowerCase().includes('stop generating') || label.toLowerCase() === 'stop';
        });
        const sendBtn = ClaudeAdapter.getSubmit();
        return !stopBtn && !!sendBtn;
    },

    getLastResponseText: () => {
        const responses = document.querySelectorAll('.font-claude-message');
        if (responses.length === 0) return "";
        const lastResponse = responses[responses.length - 1];
        return lastResponse.innerText || lastResponse.textContent;
    },

    hasRateLimitError: () => {
        const alerts = document.querySelectorAll('.text-red-500, [role="alert"]');
        for (let alert of alerts) {
            const text = alert.innerText.toLowerCase();
            if (text.includes("limit") || text.includes("too many requests") || text.includes("try again later") || text.includes("message limit")) {
                return true;
            }
        }
        return false;
    }
};

window.AIAdapter = ClaudeAdapter;
