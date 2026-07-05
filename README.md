<div align="center">
  
# AI Prompt Queue

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AI Prompt Queue** is a powerful Chrome Extension that allows you to queue multiple prompts for Google Gemini and run them sequentially, fully automated.

</div>

---

## ⚡ Features

- **Floating Queue Panel:** Manage your prompts directly on `gemini.google.com` without needing to open the extension popup.
- **Sequential Execution:** Enter a list of prompts. The extension types one, sends it, waits for Gemini to finish generating the response, and then automatically sends the next one.
- **Save & Export History:** Automatically scrapes and saves Gemini's responses. View your history and export it to a JSON file.
- **Import Prompts:** Bulk import prompts from `.txt` or `.json` files.
- **Drag-and-Drop Reordering:** Easily prioritize your queued prompts.
- **Context Menu Integration:** Highlight text on any website, right-click, and instantly add it to your prompt queue.
- **Smart Rate-Limit Detection:** Automatically pauses your queue if Gemini hits a request limit, preventing lost prompts.

## 🛠 Installation

Currently, the extension is available for manual installation:

1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** in the top right corner.
4. Click **"Load unpacked"** and select the `extension` folder from this repository.
5. Pin the extension to your toolbar for quick access.

## 🚀 Usage

1. **Navigate to Gemini:** Go to [gemini.google.com](https://gemini.google.com) and log into your account.
2. **Open the Queue:** Use the floating panel in the bottom right corner, or click the extension icon in your toolbar.
3. **Add Prompts:** 
   - Type directly into the queue panel and hit `Cmd + Enter` / `Ctrl + Enter` to send.
   - Or right-click highlighted text on any page and select "Add to Queue".
4. **Automate:** The extension will handle the rest—typing, submitting, waiting for the response, saving the output, and executing the next prompt in the queue.

## 🧠 How It Works

1. **State Management:** Prompts are stored in `chrome.storage.local`, ensuring your queue persists across page reloads and browser restarts.
2. **DOM Injection:** The extension interacts directly with Gemini's React/Angular frontend by dispatching synthetic `InputEvent`s to simulate real user typing.
3. **Response Monitoring:** A `MutationObserver` watches the DOM for Gemini's loading indicators. Once the indicators disappear, the extension scrapes the text from the response container.
4. **Safety Mechanisms:** The observer actively watches for rate-limit toast notifications. If one appears, the queue pauses and safely requeues the current prompt.

## 📄 License

This project is licensed under the MIT License.
