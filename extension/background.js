// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("AI Prompt Queue installed.");

  const defaults = {
    queue: [],
    history: [],
    isRunning: false,
    isPaused: false,
    delay: 3
  };

  chrome.storage.local.get(Object.keys(defaults), (stored) => {
    const missingDefaults = {};

    for (const [key, value] of Object.entries(defaults)) {
      if (stored[key] === undefined) missingDefaults[key] = value;
    }

    if (Object.keys(missingDefaults).length > 0) {
      chrome.storage.local.set(missingDefaults);
    }
  });

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "addToQueue",
      title: "Add '%s' to AI Prompt Queue",
      contexts: ["selection"]
    });
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
