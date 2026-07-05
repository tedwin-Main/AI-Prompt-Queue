// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("Gemini Prompt Queue installed.");
  chrome.storage.local.set({ 
    queue: [],
    history: [],
    isRunning: false,
    isPaused: false,
    delay: 3
  });

  chrome.contextMenus.create({
    id: "addToQueue",
    title: "Add '%s' to Queue",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToQueue") {
    chrome.storage.local.get(['queue'], (result) => {
      const queue = result.queue || [];
      queue.push(info.selectionText);
      chrome.storage.local.set({ queue });
    });
  }
});
