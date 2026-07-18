# Privacy Policy for AI Prompt Queue

Effective date: July 18, 2026

AI Prompt Queue is a Chrome extension that queues and submits user-provided prompts on supported AI websites. This policy explains how the extension handles user data.

## Data handled

AI Prompt Queue handles only the information needed for its user-facing features:

- Prompts entered or imported by the user.
- Text the user explicitly selects and adds through the browser context menu.
- Responses displayed by supported AI websites and saved in the extension's history.
- Queue state and settings, including running, paused, and delay values.
- The active tab URL, processed temporarily to confirm that the user is on a supported website. The URL is not retained.

This information may contain website content, user-generated content, or personal communications depending on what the user chooses to submit.

## How data is used

The extension uses this information only to:

- Maintain and process the user's prompt queue.
- Submit queued prompts when the user starts the queue.
- Detect when a response is complete or a rate limit occurs.
- Save and display prompt-and-response history.
- Import prompts and export history at the user's request.

## Storage and retention

Prompts, selected text, responses, queue state, and settings are stored locally on the user's device using `chrome.storage.local`. The developer does not operate a server that receives or stores this data.

Locally stored data remains until the user clears it in the extension, clears the extension's browser storage, or uninstalls the extension. Exported files remain wherever the user chooses to save them.

## Data transmission and sharing

When the user starts a queue, each prompt is submitted to the supported AI service open in the active tab: Google Gemini, ChatGPT, or Claude. That transmission is required to provide the extension's core function and is governed by the selected service's own terms and privacy policy.

AI Prompt Queue does not transmit user data to the developer or developer-controlled servers. The extension does not sell user data, use it for advertising or analytics, share it with data brokers, or permit the developer or other humans to read it.

## Data security

The extension limits access to the supported HTTPS websites listed in its manifest. It requests only the Chrome permissions needed for local storage, active-tab interaction, and its user-invoked context menu.

## User controls

Users can:

- Remove individual queued prompts or clear the queue.
- Clear saved history from the History view.
- Export saved history to a local JSON file.
- Delete all extension data by clearing the extension's storage or uninstalling the extension.

## Limited Use

AI Prompt Queue's use of information received from Chrome APIs complies with the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide the extension's disclosed, user-facing functionality.

## Changes

This policy may be updated when the extension's data practices change. The effective date above will be updated when revisions are made.

## Contact

Questions about this policy may be submitted through the project's issue tracker:

https://github.com/tedwin-Main/AI-Prompt-Queue/issues
