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
    }
};

window.AIAdapter = ClaudeAdapter;
