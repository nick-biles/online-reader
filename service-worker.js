const readerPanel = 'reader.html';

chrome.runtime.onInstalled.addListener(function installed() {
    addContextMenus();
    registerContentScripts();

    chrome.storage.session.setAccessLevel({accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS"});
});

var actionEvent = "popup";
chrome.action.onClicked.addListener(function actionClicked(tab) {
    console.log("Action Clicked: doInject");
    doInject("  ", tab.id, tab);
    switch(actionEvent) {
    case "readerToolbar":
        chrome.tabs.sendMessage(tab.id, { request: "trchecktoolbar" });
        break;
    case "readerSidebar":
        chrome.sidePanel.setOptions({ path: readerPanel });
        chrome.sidePanel.open({ tabId: tab.id });
        break;
    default:
    }
        
})

//var savedMessage = {test: "test"};  // discontinued due to errors when the service-worker was reloaded.
chrome.runtime.onMessage.addListener(function handleMessage(request, sender, sendResponse) {
    console.log("Recieved message" + (sender.tab ? ` from ${sender.tab?.id}.` : " from undefined."));
    switch(request.for) {
    case "readerContent":
        chrome.tabs.query({ active: true, lastFocusedWindow: true })
        .then(([tab]) => {
            chrome.tabs.sendMessage(tab.id, request);
        });
        console.log("Forwarded request to active tab's content script.")
        break;
    case "background":
        switch(request.request) {
        case "downloadPage":
            chrome.downloads.download(request.options);
            break;
        // case "addPersistentRequest":
        //     savedMessage[sender.tab?.id] = request.toRequest;
        //     console.log("Saving persisted request for sender " + sender.tab?.id + ".");
        //     break;
        // case "removePersistentRequest":
        //     delete savedMessage[sender.tab?.id];
        //     console.log("Deleted persisted data for sender " + sender.tab?.id + ".");
        //     break;
        case "injectActiveTab":
            console.log("onMessage: doInject");
            sendResponse(doInject("  ", request.to.id, request.to));
            break;
        // case "returnCurrentScroll":
        //     if (sender.tab?.id && savedMessage[sender.tab?.id]) chrome.tabs.sendMessage(sender.tab.id, savedMessage[sender.tab.id]);
        //     break;
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
            // if (savedMessage[tabId]) {
            //     chrome.tabs.sendMessage(tabId, savedMessage[tabId]);
            //     console.log(indent + "Following up injected script with persisted scroll.");
            // }
        }, () => { console.log(indent + "Failure injecting scripts "); return false; });
    });
    function handleInjectFulfilled() {
        return true;
    }
    function hadleInjectRejection() {
        return false;
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

chrome.commands.onCommand.addListener(function handleKeyboardShortcut(command, tab) {
    console.log(command + " " + (tab) ? "executed in tab #" + tab.id + "." : "executed outside of a webpage.");
});

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