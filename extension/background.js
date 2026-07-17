// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("AI Prompt Queue installed.");
  chrome.storage.local.set({ 
    queue: [],
    history: [],
    isRunning: false,
    isPaused: false,
    delay: 3
  });

  chrome.contextMenus.create({
    id: "addToQueue",
    title: "Add '%s' to AI Prompt Queue",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToQueue") {
    chrome.storage.local.get(['pendingText'], (result) => {
      const current = result.pendingText || "";
      const newText = current ? current + "\\n" + info.selectionText : info.selectionText;
      chrome.storage.local.set({ pendingText: newText });
    });
  }
});
