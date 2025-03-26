# Online Reader

This chrome extension provides accessibility features for reading online.  Currently it's not much, but I am reworking it to improve performance and security.

---
## Current Version:

The current version implements autoscroll and remembered scroll, allowing the user to set a speed at which to scroll and optionally carry over that scroll speed between page changes.

---
## Features:

**Autoscroll**  
- Automatically scrolls down the page at a set speed.

**Remembered Scroll**  
- Resumes autoscroll when a tab navigates to a new url.  Works only when the tab remains constant, opening a link in a new tab will not carry over autoscroll settings.  
- In order to enable the Remembered Scroll feature, you must right click the extension's icon at the top right and choose "Register Site with Reader".  This authorizes the extension to automatically access a tab with that url.
- Example: Clicking "Register Site with Reader" while on `https://github.com/nick-biles/online-reader` will authorize the extension to automatically resume scrolling when on any `https://github.com` webpage.

---
## Roadmap:

Rework Autoscroll Functionality  
Rework UI  
Implement Keyboard Shortcuts  
Downloading
