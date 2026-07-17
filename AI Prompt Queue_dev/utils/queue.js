// utils/queue.js

class QueueManager {
    constructor() {
        this.items = [];
        this.history = [];
        this.isRunning = false;
        this.isPaused = false;
        this.delay = 3;
    }

    async load() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['queue', 'history', 'isRunning', 'isPaused', 'delay'], (result) => {
                this.items = result.queue || [];
                this.history = result.history || [];
                this.isRunning = result.isRunning || false;
                this.isPaused = result.isPaused || false;
                this.delay = result.delay !== undefined ? result.delay : 3;
                resolve();
            });
        });
    }

    async save() {
        return new Promise((resolve) => {
            chrome.storage.local.set({
                queue: this.items,
                history: this.history,
                isRunning: this.isRunning,
                isPaused: this.isPaused,
                delay: this.delay
            }, () => resolve());
        });
    }

    async add(promptText) {
        this.items.push(promptText);
        await this.save();
    }

    async remove(index) {
        this.items.splice(index, 1);
        await this.save();
    }

    async reorder(from, to) {
        const item = this.items.splice(from, 1)[0];
        this.items.splice(to, 0, item);
        await this.save();
    }

    async setRunning(running) {
        this.isRunning = running;
        await this.save();
    }

    async setPaused(paused) {
        this.isPaused = paused;
        await this.save();
    }
}

if (typeof window !== 'undefined') {
    window.QueueManager = QueueManager;
}
