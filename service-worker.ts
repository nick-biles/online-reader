const readerPanel = 'reader.html';

// Functions to run when the extension is installed.
chrome.runtime.onInstalled.addListener(function installed() {
    // Adds context menu options
    addContextMenus();
    // Registers a default website with the reader content script.
    registerContentScripts();

    // Allows content scripts to access the extension's session storage.
    chrome.storage.session.setAccessLevel({accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS"});
});

chrome.runtime.onMessage.addListener(function handleMessage(request, sender, sendResponse) {
    console.log("Recieved message" + (sender.tab ? ` from ${sender.tab?.id}.` : " from undefined tab."));
    // Determine the target for the message.  Unused since I started sending messages direct.
    switch(request.for) {
    
    // Handle messages targetted at the background service worker.
    case "background":
        switch(request.request) {
        // case "downloadPage": // TODO: Feature on the roadmap.
        //     chrome.downloads.download(request.options);
        //     break;
        case "injectActiveTab":  // inject the reader content script into the currently active tab.
            console.log("onMessage: doInject");
            sendResponse(doInject("  ", request.to.id, request.to, null));
            break;
        case "returnMyTabId":  // Gives a content script its tabID since it doesn't have it itself.
            console.log("onMessage: returnMyTabId")
            if (sender.tab)
                sendResponse({tabId: sender.tab.id});
            else
                sendResponse();
            break;
        default:  // Handle an invalid request
            console.log("Invalid onMessage request, for background with request: " + request.request)
        }
        break;
    default: // Handle a request targetted at an invalid location.
        let text = "";
        for (let [key, value] of Object.entries(request)) {
            text += key + ": " + value + ", ";
        }
        console.log("Failed to handle message, request: " + text)
    }
})

// Injects the content script into the given tab if it is not already injected.
function doInject(indent: String, tabId: number, tab: chrome.tabs.Tab, changeInfo: any) {
    chrome.tabs.sendMessage(tabId, { request: "isReaderContentScriptHere?" })
    .then(handleInjectUnneeded, handleInject);

    // If the content script responds we don't need to inject it.
    function handleInjectUnneeded(response: any) {
        console.log(indent + `Got response from ${tabId}: ${response}`
            + (tab ? ` Status of ${tab.status}` + (changeInfo ? `, change: ${Object.entries(changeInfo)}.` : ".") : ""));
        return true;
    }

    // If there is no content script injected, then inject it.
    function handleInject(reason: any) {
        injectScriptsTo(tabId)
        .then(() => { // Successful injection
            console.log(indent + `Injected script into ${tabId}`
                + (tab ? ` with status ${tab.status}` + (changeInfo ? `, change: ${Object.entries(changeInfo)}.` : ".") : "."));
        },
        () => { // Failed injection
            console.log(indent + "Failure injecting scripts ");
            return false;
        });
    }
}

// Handle injections programatically.  Used when the tab isn't registered.
const scriptList = ["content-script.js"];
function injectScriptsTo(tabId: number) {
    return chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: scriptList,
        injectImmediately: true
    });
};

// Unused so far.
// Handles keyboard shortcuts.
// chrome.commands.onCommand.addListener(function handleKeyboardShortcut(command, tab) {
//     console.log(command + " " + (tab) ? "executed in tab #" + tab.id + "." : "executed outside of a webpage.");
// });

// Handle context menu actions.
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch(info.menuItemId) {
        case "actionMenuAddDynamicPage":  // Register the current tab's URL with the reader content script.
            if (tab && tab.url) {
                addPageToRegisteredScripts(tab.url, "reader-content-script");
            } else {
                console.log("Failure registering script, no tab info.");
            }
            break;
        // case "":
        //     break;
        default:

    }
});

// Function to setup context menus upon extension installation.
function addContextMenus() {
    chrome.contextMenus.create({
        id: "actionMenuAddDynamicPage",
        title: "Register Site with Reader",
        contexts: ["action"]
    });
}

// Function to register any default websites with the reader content script.
function registerContentScripts() {
    chrome.scripting.registerContentScripts([{
        id: "reader-content-script",
        js: ["content-script.js"],
        // enable persist across sessions to avoid having to register webpages every time the system restarts.
        persistAcrossSessions: true,
        matches: ["https://web.archive.org/*"] // Add here webpages to automatically be registed when the extension or chrome is updated.
    }])
}

// Function to register a website with the reader content script.
function addPageToRegisteredScripts(URL: string, id: string) {
    // Trims a URL down to eliminate the path. 
    let temp = URL.indexOf(".");
    let indexAfterHost = URL.substring(temp).indexOf("/") + temp;
    let trimURL = URL.substring(0, indexAfterHost) + "/*";

    // Registers the trimmed URL
    chrome.scripting.getRegisteredContentScripts({ids: [id]})
        .then((contentScript) => {
            let oldMatches = contentScript[0].matches;
            if (oldMatches === undefined)
                return true;
            let newMatches = oldMatches.concat(trimURL);
            chrome.scripting.updateContentScripts([{ id: id, matches: newMatches, persistAcrossSessions: true }]);
            console.log(`Added ${trimURL} to registered content script.`)
        });
}