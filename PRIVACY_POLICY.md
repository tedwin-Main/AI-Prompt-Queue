# Privacy Policy for AI Prompt Queue

Effective date: July 19, 2026

AI Prompt Queue is a Chrome extension that queues and submits user-provided prompts on supported AI websites. This policy explains how the extension handles user data.

## Data handled

AI Prompt Queue handles only the information needed for its user-facing features:

- Prompts entered by the user.
- Text the user explicitly selects and adds through the browser context menu.
- Text currently entered or waiting in the floating-panel input.
- Queue contents stored so they remain available across page reloads and browser restarts.
- Response-completion indicators processed temporarily from the supported website's page.

The extension does not save AI response content or browsing history. It does not import prompts from files or export prompts, queues, or responses to files. Prompts and selected text may contain website content, user-generated content, or personal communications depending on what the user chooses to submit.

## How data is used

The extension uses this information only to:

- Maintain and process the user's prompt queue.
- Submit queued prompts when the user starts the queue.
- Detect when a response is complete before submitting the next queued prompt.

## Storage and retention

Queued prompts and current floating-panel input, including selected text, are stored locally on the user's device using `chrome.storage.local`. The extension does not create or retain a response-history database, and it does not read or create TXT or JSON files. The developer does not operate a server that receives or stores extension data.

Locally stored data remains until the user removes or clears the queue, clears the extension's browser storage, or uninstalls the extension.

## Data transmission and sharing

When the user starts a queue, each prompt is submitted to the supported AI service on the page where the extension's floating panel is running: Google Gemini, ChatGPT, or Claude. That transmission is required to provide the extension's core function and is governed by the selected service's own terms and privacy policy.

AI Prompt Queue does not transmit user data to the developer or developer-controlled servers. The extension does not sell user data, use it for advertising or analytics, share it with data brokers, or permit the developer or other humans to read it.

## Data security

The extension limits access to the supported HTTPS websites listed in its manifest. It requests only the Chrome permissions needed for local queue storage and its user-invoked context menu.

## User controls

Users can:

- Remove individual queued prompts or clear the queue.
- Clear text waiting in the floating-panel input.
- Delete all extension data by clearing the extension's storage or uninstalling the extension.

## Limited Use

AI Prompt Queue's use of information received from Chrome APIs complies with the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide the extension's disclosed, user-facing functionality.

## Changes

This policy may be updated when the extension's data practices change. The effective date above will be updated when revisions are made.

## Contact

Questions about this policy may be submitted through the project's issue tracker:

https://github.com/tedwin-Main/AI-Prompt-Queue/issues
