# Chrome Web Store Submission

## Single purpose

AI Prompt Queue queues prompts and submits them sequentially on supported AI websites while saving the resulting response history locally.

## Store-listing data disclosure

Use this text prominently in the store listing:

> AI Prompt Queue reads prompts, user-selected text, and AI responses on supported sites to automate the prompt queue and save history locally. Prompts are sent only to the AI service selected by the user. Data is not sent to the extension developer.

## Permission justifications

### `storage`

Saves prompt queues, settings, processing state, and prompt-and-response history locally on the user's device.

### `activeTab`

Checks whether the active tab is a supported AI website and communicates with the site's content script after the user opens the extension popup.

### `contextMenus`

Provides the user-invoked “Add to AI Prompt Queue” menu item for selected text.

### Site access

Injects the queue interface and interacts with prompt fields and responses only on these supported HTTPS websites:

- `https://gemini.google.com/*`
- `https://chatgpt.com/*`
- `https://claude.ai/*`

## Privacy Practices declarations

- The extension handles website content: prompts, explicitly selected text, and AI responses.
- The handled content may include personal communications when the user chooses to place such content in a prompt.
- Data is used only for the extension's single purpose and user-facing features.
- Data is stored locally with `chrome.storage.local`.
- Data is not sold, used for advertising or analytics, or sent to the developer.
- Prompts are transmitted only to the AI website chosen by the user when the user starts the queue.

Publish `PRIVACY_POLICY.md` at a stable public HTTPS URL and enter that URL in the Privacy Practices tab before submission.

## Exact-package test checklist

Extract `AI-Prompt-Queue-v1.2.zip`, then load the extracted directory with Chrome's **Load unpacked** button. Test the extracted package rather than the source directory.

Repeat these checks on Gemini, ChatGPT, and Claude:

1. Confirm the floating queue panel appears.
2. Add two harmless test prompts and verify their order.
3. Start the queue and confirm each prompt is submitted once.
4. Confirm processing waits for each response before sending the next prompt.
5. Pause, resume, and stop the queue.
6. Confirm prompts and responses appear in History.
7. Export History and verify the JSON file.
8. Reload the AI page and confirm stored state remains available.

Additional checks:

1. Select harmless text on a normal HTTPS page and use **Add to AI Prompt Queue** from the context menu.
2. Open a supported AI site and confirm the selected text appears in the queue input.
3. Update the unpacked extension and confirm existing queue, history, and delay settings are preserved.
4. Inspect `chrome://extensions` and the service-worker console for errors.
