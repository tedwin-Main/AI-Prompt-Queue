# Chrome Web Store Submission Guide

Use this guide for the minimal floating-panel release, version `1.3`.

This guide covers the dashboard sections that can affect review: **Package**, **Store listing**, **Privacy**, **Distribution**, **Test instructions**, and **Status**. Dashboard labels can change. Complete every field marked with `*`, but never claim a permission, feature, data practice, or affiliation that is not present in the submitted package.

## Critical: do not justify `activeTab`

Version `1.3` does not request or use `activeTab`. If the Privacy page still shows a required **activeTab justification** field, the dashboard is reading an older uploaded package.

Do not enter a made-up justification and do not submit while that field is present. Instead:

1. Open **Build → Package**.
2. Upload `AI-Prompt-Queue-v1.3.zip`.
3. Confirm the package version is `1.3`.
4. Confirm the API-permission list contains only `storage` and `contextMenus`.
5. Return to **Privacy** and refresh the page.
6. Confirm the **activeTab justification** and **scripting justification** fields are gone.

If either field remains, stop and verify that the uploaded ZIP is the v1.3 ZIP whose root `manifest.json` has no `activeTab`, `scripting`, `action`, or `host_permissions` entry. Content-script match patterns will still produce a **Host permission justification** field; that field is expected and must be completed.

## 1. Upload the corrected package

1. Open the Chrome Web Store Developer Dashboard.
2. Select **AI Prompt Queue**.
3. Open **Build → Package**.
4. Upload `AI-Prompt-Queue-v1.3.zip`.
5. Confirm that the dashboard shows version `1.3`.
6. Confirm that only `storage` and `contextMenus` appear under API permissions.
7. Confirm that `scripting` and `activeTab` are not listed.

The ZIP contains `manifest.json` at its root. Do not place the ZIP inside another folder.

## 2. Store listing

### Title

```text
AI Prompt Queue
```

This comes from `manifest.json`. Do not add “official,” “OpenAI,” “ChatGPT,” “Gemini,” or “Claude” to the title.

### Summary from the package

```text
Queue prompts and send them sequentially on ChatGPT, Gemini, and Claude.
```

This comes from `manifest.json` and is below Chrome's 132-character summary limit.

### Description

```text
AI Prompt Queue adds a focused floating queue panel directly to ChatGPT, Google Gemini, and Claude. The panel appears automatically on supported sites, so no toolbar popup is required.

Main features:

- Add and review multiple prompts in a floating panel.
- Send prompts sequentially and wait for each response to finish.
- Pause before the next queued prompt is sent, then resume from the same queue.
- Remove individual queued prompts or clear the queue.
- Use the Add to Queue button or Cmd/Ctrl + Enter to add prompts; adding the first prompt starts sequential sending automatically.
- Place explicitly selected text in the floating-panel input using the browser context menu so the user can review it before adding it.
- Keep queued prompts locally across page reloads and browser restarts.

Supported websites:

- https://chatgpt.com
- https://gemini.google.com
- https://claude.ai

Privacy:

AI Prompt Queue stores queued prompts and current floating-panel input, including text explicitly selected by the user, locally with Chrome storage. Prompts are submitted only to the supported AI service currently open by the user. AI response content and browsing history are not saved. The extension does not import or export files and does not keep response history.

Data is not sent to the extension developer, sold, used for advertising, or used for analytics. Users can remove queued prompts, clear the queue, clear the extension's browser storage, or uninstall the extension to delete locally stored data.

AI Prompt Queue is an independent extension and is not affiliated with, endorsed by, or sponsored by OpenAI, Google, or Anthropic.
```

### Category and language

- Category: **Tools**
- Language: **English**

Do not add localizations unless the extension and every localized listing are actually maintained in those languages.

### Homepage URL

Enter:

```text
https://github.com/tedwin-Main/AI-Prompt-Queue
```

### Support URL

Enter:

```text
https://github.com/tedwin-Main/AI-Prompt-Queue/issues
```

### Official URL

Leave this blank unless the dashboard offers a domain that this publisher has verified through Google Search Console. Do not claim GitHub, OpenAI, Google, Anthropic, ChatGPT, Gemini, or Claude as an official publisher domain.

### Mature content

Select **No**. The extension and listing must not contain mature content.

### Privacy policy URL

Enter:

```text
https://github.com/tedwin-Main/AI-Prompt-Queue/blob/main/PRIVACY_POLICY.md
```

Verify all URLs in an incognito window before submission.

## 3. Graphic assets

Use screenshots from the exact version `1.3` package. Use `1280×800` or `640×400` images.

Complete each visible required asset field:

- **Store icon:** use the current `128×128` extension icon.
- **Screenshots:** upload at least one current screenshot; up to five are allowed. Prefer five accurate screenshots.
- **Small promo tile:** if requested, upload a clean `440×280` PNG or JPEG using the same branding.
- **Marquee promo tile:** optional unless the dashboard marks it required; size `1400×560`.
- **Promotional video:** optional. Leave blank unless there is a current public YouTube demonstration of version 1.3.

Recommended screenshots:

1. Floating queue panel on ChatGPT with harmless sample prompts.
2. Floating queue panel showing several queued prompts and the Pause control while running.
3. Collapsed floating panel demonstrating the low-distraction state.
4. Floating queue panel on Gemini.
5. Floating queue panel on Claude.

Do not show the removed toolbar popup. Do not include private conversations, account details, names, email addresses, or misleading claims.

## 4. Privacy Practices

### Single purpose

```text
AI Prompt Queue provides a floating panel on supported AI websites for queuing user-provided prompts and submitting them sequentially.
```

### Permission justifications

#### `storage`

```text
Stores queued prompts and the current panel input, including text explicitly added through the context menu, locally with chrome.storage.local so they remain available across page reloads and browser restarts. The extension does not store AI responses or browsing history.
```

#### `activeTab`

Do not fill this field. Version 1.3 does not request `activeTab`. If the field appears, follow **Critical: do not justify `activeTab`** above and upload the corrected package before continuing.

#### `contextMenus`

```text
Creates the user-invoked “Add to AI Prompt Queue” context-menu command. Chrome provides only the text the user explicitly selects; the extension places that text in the locally stored panel input for the user to review before adding or sending it.
```

#### Host permission justification

```text
Required only on https://chatgpt.com/*, https://gemini.google.com/*, and https://claude.ai/* to insert the floating queue panel, place user-approved queued text into the site's prompt composer, activate the site's send control, and observe response-completion indicators before submitting the next queued prompt. No other hosts receive injected content scripts or are read through host access. AI response content and browsing history are not stored.
```

Exact site patterns:

- `https://chatgpt.com/*`
- `https://gemini.google.com/*`
- `https://claude.ai/*`

These matches are declared under `content_scripts.matches`. They are why the dashboard requests a host-permission justification even though `manifest.json` has no separate `host_permissions` key.

### Remote code

Select:

```text
No, I am not using remote code.
```

All executable JavaScript is packaged inside the extension.

### Data usage

Declare:

- **Website content**
- **Personal communications**

Declare these because prompts and explicitly selected text can contain page content or communication text, even though processing and storage are local. Do not select **No data collected**.

Do not declare web/browsing history, authentication information, personally identifiable information, health information, location, financial information, or user activity unless the extension is later changed to handle such data. The current version does not track visited URLs, clicks, keystrokes outside its own prompt input, or general browsing behavior.

Use this explanation where available:

```text
Queued prompts and current floating-panel input, including text explicitly selected by the user, are processed only to provide the extension's floating queue. They are stored locally using chrome.storage.local. Prompts are submitted only to the supported AI website where the floating panel is running. AI response content and browsing history are not saved. The extension does not import or export TXT or JSON files and does not keep response history. Data is not sent to the extension developer, sold, used for advertising, or used for analytics.
```

### Data-use certifications

Certify each statement shown by the dashboard because the current extension behavior satisfies them:

- Data is not sold or transferred to third parties outside approved use cases.
- Data is not used or transferred for purposes unrelated to the extension's single purpose.
- Data is not used or transferred to determine creditworthiness or for lending purposes.

Prompts are transmitted to the supported AI service only when needed to perform the user-requested queue function. Keep every certification consistent with `PRIVACY_POLICY.md` and actual extension behavior.

### Privacy policy

Enter this public HTTPS URL:

```text
https://github.com/tedwin-Main/AI-Prompt-Queue/blob/main/PRIVACY_POLICY.md
```

Open it in an incognito window and confirm it is readable without signing in. Confirm its effective date and statements match version 1.3 before submission.

## 5. Distribution

Use these settings for a normal public, free release:

- **Visibility:** Public.
- **Regions:** All regions, unless there is a legal or operational reason to exclude a region.
- **Pricing/payment:** Free or no payment, if this field appears.
- **Trusted testers / Google Groups:** leave empty for the public production item.

Changing visibility to Unlisted or Private does not avoid policy review. Do not label this production item “BETA,” “TESTING,” or “DEVELOPMENT BUILD.”

## 6. Test instructions for reviewers

Open **Access → Test instructions** and paste:

```text
AI Prompt Queue works on these supported websites:

https://chatgpt.com
https://gemini.google.com
https://claude.ai

A valid account for the selected AI service may be required.

Testing steps:

1. Open one of the supported websites and sign in.
2. Confirm the floating AI Prompt Queue panel appears automatically in the bottom-right corner. No toolbar-popup interaction is required.
3. Enter a harmless prompt and confirm the button says “Add to Queue.” Press Cmd/Ctrl + Enter or click it.
4. Confirm the first prompt is submitted automatically without clicking a separate start control.
5. Add two more harmless prompts with Cmd/Ctrl + Enter while the first response is running.
6. Confirm the Pause button appears while the queue is running. Click “Pause” and confirm the button changes to “Resume.”
7. Confirm the current response finishes and both remaining prompts stay queued while paused.
8. Click “Resume.” While the AI service's stop control is visible for the second prompt, confirm the third prompt remains queued. Confirm the third prompt sends only after the stop control disappears.
9. Start a new queue, pause it, add another prompt with Cmd/Ctrl + Enter, reload the page, and confirm the queued prompt remains in the floating panel.
10. Remove an individual queued prompt and test Clear All.
11. Collapse and expand the floating panel from its header.
12. Select harmless text on another webpage, right-click, and choose “Add to AI Prompt Queue.” Open a supported AI site and confirm the selected text appears in the floating-panel input.

The extension does not save AI response content or browsing history. It does not import or export files and does not use remote code, developer servers, analytics, or advertising.
```

If the dashboard has separate fields, use:

**Test account credentials**

```text
Not applicable. AI Prompt Queue has no extension account or login system. A reviewer may use an existing test account for any supported third-party AI service.
```

**Additional instructions**

Use the full testing block above. Never enter a personal password or production account credential.

## 7. Developer account and listing preflight

Before final testing, confirm:

- The developer account has 2-Step Verification enabled.
- Developer contact email is verified, monitored, and able to receive external mail.
- Publisher/developer display name is accurate and does not imply affiliation with OpenAI, Google, or Anthropic.
- Homepage, support, and privacy-policy URLs work without authentication.
- The listing contains a description, icon, and at least one current screenshot.
- No screenshot, description, or promotional image shows removed features.
- No metadata uses unsupported superlatives, irrelevant keywords, testimonials, ratings, install counts, or “official” claims.
- The privacy declarations, privacy policy, listing description, reviewer instructions, manifest, and actual behavior all agree.

## 8. Exact-package checklist

Extract `AI-Prompt-Queue-v1.3.zip`, then load the extracted directory from `chrome://extensions` using **Load unpacked**. Test the extracted package, not the source directory.

Repeat on ChatGPT, Gemini, and Claude:

1. Confirm the floating panel appears automatically.
2. Confirm clicking the toolbar icon does not open the removed popup.
3. Confirm the primary button says “Add to Queue” while the input contains text.
4. Add one harmless prompt with Cmd/Ctrl + Enter and verify sending begins immediately.
5. Add two more harmless prompts while the first response is running and verify their order.
6. Pause during generation and confirm both remaining prompts stay queued after the current response finishes.
7. Resume, then confirm the third prompt remains queued while the visible stop control indicates generation of the second response and sends only after that control disappears.
8. Confirm individual deletion and Clear All work.
9. Confirm collapse, expand, and dragging work.
10. While paused, add another prompt with Cmd/Ctrl + Enter, reload the page, and confirm the queued prompt persists.
11. Inspect `chrome://extensions` and the extension service-worker console for errors.

Confirm the package does not contain:

- `popup.html`
- `popup.js`
- `popup.css`
- `utils/queue.js`

Also confirm that the package contains no file picker, `FileReader`, download API, export routine, or response-history UI.

## 9. Save and resubmit

1. Save every dashboard section with **Save draft**.
2. Confirm the Package page shows version `1.3`.
3. Reopen **Privacy** and confirm there are no `activeTab` or `scripting` justification fields.
4. Confirm **Host permission justification**, `storage`, and `contextMenus` are filled.
5. Confirm the Privacy page contains the privacy-policy URL, data categories, certifications, single purpose, and remote-code declaration.
6. Confirm Store listing, Distribution, and Test instructions are saved without warnings.
7. Open **Build → Status**.
8. Select version `1.3` and click **Submit for review**.

Suggested reviewer note:

```text
Version 1.3 removes the unused scripting permission identified under Purple Potassium and narrows the extension to a floating-panel-only experience. The toolbar popup, activeTab permission, file import, file export, saved response history, and rate-limit message inspection were removed. The remaining storage and contextMenus permissions are actively used. Site access is limited to HTTPS on ChatGPT, Gemini, and Claude. The extension observes only response-completion controls needed for sequential sending; Pause and Resume only hold or continue the local queue. AI response content and browsing history are not saved.
```

Do not appeal the old rejection. Submit version `1.3` as the corrected package.

## 10. Official references

- [Fill out the privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Complete your listing information](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Set up distribution](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution)
- [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [User Data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
