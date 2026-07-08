// utils/gemini-adapter.js

const INPUT = 'div[contenteditable="true"].ql-editor';
const INPUT_ALT = 'rich-textarea div[contenteditable]';
const SUBMIT = 'button[aria-label="Send message"]';
const LOADING = 'model-response loading-indicator';
const RESPONSE_CONTAINER = 'model-response';
const ERROR_TOAST = 'snack-bar-container';

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
    },

    getLastResponseText: () => {
        const responses = document.querySelectorAll(RESPONSE_CONTAINER);
        if (responses.length === 0) return "";
        const lastResponse = responses[responses.length - 1];
        return lastResponse.innerText || lastResponse.textContent;
    },

    hasRateLimitError: () => {
        const toast = document.querySelector(ERROR_TOAST);
        if (!toast) return false;
        const text = toast.innerText.toLowerCase();
        return text.includes("limit") || text.includes("too many requests") || text.includes("try again later");
    }
};

window.AIAdapter = GeminiAdapter;
