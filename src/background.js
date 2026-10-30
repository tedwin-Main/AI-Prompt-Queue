// Manages extension lifecycle, initial storage defaults, and context menu actions.

console.log("AI Prompt Queue service worker loaded.");

// Extension > Background > Lifecycle: initialize storage and menus
chrome.runtime.onInstalled.addListener(() => {
  console.log("AI Prompt Queue installed.");

  const defaults = {
    queue: [],
    panelSize: "full",
    panelPosition: null
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

  // Version 1.3 removes response history and popup-only processing settings.
  chrome.storage.local.remove(["history", "isRunning", "isPaused", "delay"]);

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "addToQueue",
      title: "Add '%s' to AI Prompt Queue",
      contexts: ["selection"]
    });
  });
});

// Extension > Background > Context Menu: capture highlighted prompt text
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToQueue") {
    chrome.storage.local.get(['pendingText'], (result) => {
      const current = result.pendingText || "";
      const newText = current ? current + "\n" + info.selectionText : info.selectionText;
      chrome.storage.local.set({ pendingText: newText });
    });
  }
});
