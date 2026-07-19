// utils/chatgpt-adapter.js

const ChatGPTAdapter = {
    hostPattern: 'chatgpt.com',
    
    getInput: () => {
        return document.querySelector('#prompt-textarea');
    },
    
    getSubmit: () => {
        return document.querySelector('button[data-testid="send-button"]');
    },
    
    isResponseComplete: () => {
        const stopBtn = document.querySelector('button[aria-label="Stop generating"]');
        const sendBtn = ChatGPTAdapter.getSubmit();
        return !stopBtn && !!sendBtn;
    },

    hasRateLimitError: () => {
        const toast = document.querySelector('#toast-root, .toast-container, [role="alert"]');
        if (!toast) return false;
        const text = toast.innerText.toLowerCase();
        return text.includes("limit") || text.includes("too many requests") || text.includes("try again later") || text.includes("usage cap");
    }
};

window.AIAdapter = ChatGPTAdapter;
