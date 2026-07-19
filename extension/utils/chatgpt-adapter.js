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
    }
};

window.AIAdapter = ChatGPTAdapter;
