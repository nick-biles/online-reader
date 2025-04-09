const readerPanel = 'reader.html';

chrome.runtime.onInstalled.addListener(function installed() {
    addContextMenus();
    registerContentScripts();

    chrome.storage.session.setAccessLevel({accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS"});
});

// Popup scrolling menu when extension icon (action) is clicked.
// var actionEvent = "popup"; // TODO: Intended for future support for different menu types.
chrome.action.onClicked.addListener(function actionClicked(tab) {
    console.log("Action Clicked: doInject");
    doInject("  ", tab.id, tab);
    // switch(actionEvent) { TODO: Intended for future support for different menu types.
    // case "readerToolbar":
    //     chrome.tabs.sendMessage(tab.id, { request: "trchecktoolbar" });
    //     break;
    // case "readerSidebar":
    //     chrome.sidePanel.setOptions({ path: readerPanel });
    //     chrome.sidePanel.open({ tabId: tab.id });
    //     break;
    // default:
    // }
})

chrome.runtime.onMessage.addListener(function handleMessage(request, sender, sendResponse) {
    console.log("Recieved message" + (sender.tab ? ` from ${sender.tab?.id}.` : " from undefined tab."));
    switch(request.for) {
    
    // Handle messages targetted at the background service worker.
    case "background":
        switch(request.request) {
        // case "downloadPage": // TODO: Feature on the roadmap.
        //     chrome.downloads.download(request.options);
        //     break;
        case "injectActiveTab":
            console.log("onMessage: doInject");
            sendResponse(doInject("  ", request.to.id, request.to));
            break;
        case "returnMyTabId":
            console.log("onMessage: returnMyTabId")
            sendResponse({tabId: sender.tab.id});
            break;
        default:
            console.log("Invalid onMessage request, for background with request: " + request.request)
        }
        break;
    default:
        let text = "";
        for (let [key, value] of Object.entries(request)) {
            text += key + ": " + value + ", ";
        }
        console.log("Failed to handle message, request: " + text)
    }
})


function doInject(indent, tabId, tab, changeInfo) {
    chrome.tabs.sendMessage(tabId, { request: "isReaderContentScriptHere?" })
    .then((response) => {
        console.log(indent + `Got response from ${tabId}: ${response}`
            + (tab ? ` Status of ${tab.status}` + (changeInfo ? `, change: ${Object.entries(changeInfo)}.` : ".") : ""));
        return true;
    }, () => {
        injectScriptsTo(tabId)
        .then(() => {
            console.log(indent + `Injected script into ${tabId}`
                + (tab ? ` with status ${tab.status}` + (changeInfo ? `, change: ${Object.entries(changeInfo)}.` : ".") : "."));
        }, () => { console.log(indent + "Failure injecting scripts "); return false; });
    });
    }
}

const scriptList = ["content-script.js"];
function injectScriptsTo(tabId) {
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

chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch(info.menuItemId) {
        case "actionMenuAddDynamicPage":
            addPageToRegisteredScripts(tab.url, "reader-content-script");
            break;
        case "":
            break;
        default:

    }
});

function addContextMenus() {
    chrome.contextMenus.create({
        id: "actionMenuAddDynamicPage",
        title: "Register Site with Reader",
        contexts: ["action"]
    });
}

function registerContentScripts() {
    chrome.scripting.registerContentScripts([{
        id: "reader-content-script",
        js: ["content-script.js"],
        matches: ["https://web.archive.org/*"] // Add here webpages to automatically be registed when the extension or chrome is updated.
    }])
}

function addPageToRegisteredScripts(URL, id) {
    let temp = URL.indexOf(".");
    indexAfterHost = URL.substring(temp).indexOf("/") + temp;
    let trimURL = URL.substring(0, indexAfterHost) + "/*";
    chrome.scripting.getRegisteredContentScripts({ids: [id]})
        .then((contentScript) => {
            let newMatches = contentScript[0].matches.concat(trimURL);
            chrome.scripting.updateContentScripts([{ id: id, matches: newMatches }]);
            console.log(`Added ${trimURL} to registered content script.`)
        });
}