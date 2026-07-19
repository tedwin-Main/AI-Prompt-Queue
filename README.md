<div align="center">
  
# AI Prompt Queue

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AI Prompt Queue** adds a focused floating panel to Google Gemini, ChatGPT, and Claude for sending queued prompts sequentially.
</div>

---

## ⚡ Features

- **Floating Queue Panel:** Manage prompts directly on `gemini.google.com`, `chatgpt.com`, or `claude.ai` without opening a toolbar popup.
- **Sequential Execution:** Enter a list of prompts. The extension types one, sends it, waits for the AI to finish generating the response, and then automatically sends the next one.
- **Context Menu Integration:** Highlight text on any website, right-click, and instantly add it to your prompt queue.
- **Rate-Limit Protection:** Stops the queue and requeues the current prompt when a supported site displays a recognized rate-limit message.
- **Local Queue Storage:** Keeps queued prompts on the user's device with `chrome.storage.local`.

## 🛠 Installation

Currently, the extension is available for manual installation:

1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** in the top right corner.
4. Click **"Load unpacked"** and select the `extension` folder from this repository.
5. Open a supported AI website. The floating queue panel appears automatically.

## 🚀 Usage

1. **Navigate to an AI:** Go to [gemini.google.com](https://gemini.google.com), [chatgpt.com](https://chatgpt.com), or [claude.ai](https://claude.ai) and log into your account.
2. **Open the Queue:** Use the floating panel in the bottom right corner.
3. **Add Prompts:** 
   - Type directly into the queue panel and click **Add to Queue**, or press `Cmd + Enter` / `Ctrl + Enter`.
   - Or right-click highlighted text on any page and select "Add to Queue".
4. **Send:** When the input is empty and prompts are queued, the same button changes to **Send to Queue**. Click it to begin sequential processing.

## 🧠 How It Works

1. **State Management:** Prompts are stored in `chrome.storage.local`, ensuring your queue persists across page reloads and browser restarts.
2. **DOM Injection:** The extension interacts directly with the AI's frontend by dispatching synthetic `InputEvent`s to simulate real user typing.
3. **Response Monitoring:** A `MutationObserver` watches the DOM for completion indicators without saving response content.
4. **Safety Mechanisms:** The observer watches for recognized rate-limit messages. If one appears, the queue stops and safely requeues the current prompt.

## 📄 License

This project is licensed under the MIT License.

## 🔒 Privacy

AI Prompt Queue stores queued prompts and current floating-panel input, including user-selected text, locally. Prompts are sent only to the supported AI service currently open by the user. AI response content is not saved, and data is not sent to the extension developer.

The minimal version does not import TXT or JSON files, export data, or keep response history.

See the [Privacy Policy](PRIVACY_POLICY.md) for details.
