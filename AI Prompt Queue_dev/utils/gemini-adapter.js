// utils/gemini-adapter.js

const INPUT = 'div[contenteditable="true"].ql-editor';
const INPUT_ALT = 'rich-textarea div[contenteditable]';
const SUBMIT = 'button[aria-label="Send message"]';

const GeminiAdapter = {
    hostPattern: 'gemini.google.com',
    
    getInput: () => {
        return document.querySelector(INPUT) || document.querySelector(INPUT_ALT);
    },
    
    getSubmit: () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const sendBtn = buttons.find(b => {
            const label = b.getAttribute('aria-label') || '';
            return label.toLowerCase().includes('send message') || label.toLowerCase().includes('send');
        });
        return sendBtn || document.querySelector(SUBMIT);
    },
    
    isResponseComplete: () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const stopBtn = buttons.find(b => {
            const label = b.getAttribute('aria-label') || '';
            return label.toLowerCase().includes('stop');
        });
        const sendBtn = GeminiAdapter.getSubmit();
        return !stopBtn && !!sendBtn && !sendBtn.disabled;
    }
};

window.AIAdapter = GeminiAdapter;
