// popup.js

document.addEventListener('DOMContentLoaded', async () => {
    const queueManager = new QueueManager();
    await queueManager.load();
    
    // UI Elements
    const queueListEl = document.getElementById('queue-list');
    const queueCountEl = document.getElementById('queue-count');
    const historyListEl = document.getElementById('history-list');
    const promptInput = document.getElementById('prompt-input');
    const addBtn = document.getElementById('add-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const exportBtn = document.getElementById('export-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const statusBadge = document.getElementById('status-badge');
    const delaySlider = document.getElementById('delay-slider');
    const delayValue = document.getElementById('delay-value');
    
    const tabQueue = document.getElementById('tab-queue');
    const tabHistory = document.getElementById('tab-history');
    const viewQueue = document.getElementById('view-queue');
    const viewHistory = document.getElementById('view-history');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');

    let totalItemsRun = 0;

    // Tabs
    tabQueue.onclick = () => {
        tabQueue.classList.add('active'); tabHistory.classList.remove('active');
        viewQueue.classList.add('active-view'); viewHistory.classList.remove('active-view');
    };
    tabHistory.onclick = () => {
        tabHistory.classList.add('active'); tabQueue.classList.remove('active');
        viewHistory.classList.add('active-view'); viewQueue.classList.remove('active-view');
        renderHistory();
    };

    // Render logic
    function renderQueue() {
        queueListEl.innerHTML = '';
        queueCountEl.textContent = queueManager.items.length;
        
        queueManager.items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'queue-item';
            li.draggable = true;
            
            const span = document.createElement('span');
            span.className = 'text';
            span.textContent = item;
            
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = '✕';
            delBtn.onclick = async () => {
                await queueManager.remove(index);
                renderQueue();
            };
            
            li.appendChild(span);
            li.appendChild(delBtn);
            
            // Drag logic
            li.ondragstart = (e) => { e.dataTransfer.setData('text/plain', index); };
            li.ondragover = (e) => { e.preventDefault(); };
            li.ondrop = async (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = index;
                if (fromIndex !== toIndex) {
                    await queueManager.reorder(fromIndex, toIndex);
                    renderQueue();
                }
            };

            queueListEl.appendChild(li);
        });
        
        updateProgress();
    }

    function renderHistory() {
        historyListEl.innerHTML = '';
        queueManager.history.forEach(h => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `<strong>${h.prompt}</strong><p>${h.response}</p>`;
            historyListEl.appendChild(li);
        });
    }

    function updateProgress() {
        if (queueManager.isRunning || queueManager.isPaused) {
            progressContainer.style.display = 'block';
            const total = queueManager.items.length + totalItemsRun;
            const pct = total === 0 ? 0 : (totalItemsRun / total) * 100;
            progressFill.style.width = `${pct}%`;
        } else {
            progressContainer.style.display = 'none';
        }
    }

    async function syncState() {
        await queueManager.load();
        
        delaySlider.value = queueManager.delay;
        delayValue.textContent = queueManager.delay;
        
        if (queueManager.isRunning) {
            statusBadge.textContent = 'Running';
            statusBadge.className = 'badge running';
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'block';
            pauseBtn.textContent = 'Pause';
            if(queueListEl.firstElementChild) {
                queueListEl.firstElementChild.classList.add('running-item');
            }
        } else if (queueManager.isPaused) {
            statusBadge.textContent = 'Paused';
            statusBadge.className = 'badge paused';
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'block';
            pauseBtn.textContent = 'Resume';
        } else {
            statusBadge.textContent = 'Idle';
            statusBadge.className = 'badge idle';
            startBtn.style.display = 'block';
            pauseBtn.style.display = 'none';
        }
        
        renderQueue();
    }

    // Interactions
    addBtn.onclick = async () => {
        const text = promptInput.value.trim();
        if (text) {
            await queueManager.add(text);
            promptInput.value = '';
            renderQueue();
        }
    };

    delaySlider.oninput = async () => {
        delayValue.textContent = delaySlider.value;
        queueManager.delay = parseInt(delaySlider.value);
        await queueManager.save();
    };

    importBtn.onclick = () => importFile.click();
    importFile.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        let newItems = [];
        if (file.name.endsWith('.json')) {
            try { newItems = JSON.parse(text); } catch (e) {}
        } else {
            newItems = text.split('\n\n').filter(t => t.trim());
        }
        for (let item of newItems) {
            if (typeof item === 'string') await queueManager.add(item);
        }
        importFile.value = '';
        renderQueue();
    };

    exportBtn.onclick = () => {
        const data = JSON.stringify(queueManager.history, null, 2);
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'gemini-results.json';
        a.click();
    };

    clearHistoryBtn.onclick = async () => {
        queueManager.history = [];
        await queueManager.save();
        renderHistory();
    };

    startBtn.onclick = () => {
        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            if (tabs[0] && tabs[0].url.includes("gemini.google.com")) {
                totalItemsRun = 0;
                await queueManager.setRunning(true);
                await queueManager.setPaused(false);
                chrome.tabs.sendMessage(tabs[0].id, { action: "START_QUEUE" });
                syncState();
            } else {
                alert("Please navigate to gemini.google.com to start the queue.");
            }
        });
    };

    pauseBtn.onclick = async () => {
        const willPause = !queueManager.isPaused;
        await queueManager.setPaused(willPause);
        await queueManager.setRunning(!willPause);
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: willPause ? "PAUSE_QUEUE" : "RESUME_QUEUE" });
        });
        syncState();
    };

    stopBtn.onclick = async () => {
        await queueManager.setRunning(false);
        await queueManager.setPaused(false);
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: "STOP_QUEUE" });
        });
        syncState();
    };

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.queue || changes.isRunning || changes.isPaused) {
            syncState();
        }
        if (changes.history && viewHistory.classList.contains('active-view')) {
            renderHistory();
        }
    });

    syncState();
});
