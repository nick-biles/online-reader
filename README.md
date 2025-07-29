# Online Reader

This chrome extension provides accessibility features for reading online.

---
## Current Version:

The current version implements autoscroll and remembered scroll, allowing the user to set a speed at which to scroll and optionally carry over that scroll speed between page changes.  You can use keyboard shortcuts to interact with the plugin or open the action menu by clicking the extension icon in the chrome extension bar.

---
## Features:

**Autoscroll**  
- Automatically scrolls down the page at a set speed.

**Remembered Scroll**  
- Resumes autoscroll when a tab navigates to a new url.  Works only when the tab remains constant, opening a link in a new tab will not carry over autoscroll settings.  
- In order to enable the Remembered Scroll feature, you must right click the extension's icon at the top right and choose "Register Site with Reader".  This authorizes the extension to automatically access a tab with that url.
- Example: Clicking "Register Site with Reader" while on `https://github.com/nick-biles/online-reader` will authorize the extension to automatically resume scrolling when on any `https://github.com` webpage.

**Keyboard Shortcuts**  
- The extension currently allows for the use of keyboard shortcuts for the following functions:
    - Autoscroll                (Suggested: Alt+Down)
    - Remembered Autoscroll     (Suggested: Alt+Shift+Down)
    - Stop Autoscroll           (Suggested: Alt+Up)
    - Register Site             (Suggested: Alt+Shift+Home)

---
## Roadmap:

- [x] Rework Autoscroll Functionality
- [x] Implement Keyboard Shortcuts  
- [ ] Rework UI
- [ ] Downloading


---
## Currently Known Bugs:

- Stop Scrolling function doesn't stop remembered scrolling from resuming on page change.
    - Fix must prevent remembered speed from changing to 0 and also prevent Stop Scrolling from cancelling Remembered Scrolling while on an unrelated page.