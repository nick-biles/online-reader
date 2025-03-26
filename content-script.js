console.log("content-script: I am running!");

var debug = true;
var storageKey = "orContentScript";
var myTabId = -1;

chrome.runtime.onMessage.addListener(function recieveMessage(request, sender, sendResponse) {
    console.log("content-script: Received Message");
    if (debug) {
        let text = "";
        for (let [key, value] of Object.entries(request)) {
            text += key + ": " + value + "\n";
        }
        console.log(text);
    }
    switch (request.request) {
        case "isReaderContentScriptHere?":
            sendResponse("Online Reader content-script is present.");
            return;
        case "trchecktoolbar": // TODO, maybe implement toolbar below bookmark bar
            console.log("content-script: Loading Online Reader Toolbar! (TODO)");
            sendResponse(false);
            return false;
        default:
            sendResponse(reader[request.request](request));
    }
});

// Functions and variables part of reader tool.
// Navigate Section
var scrollIntervalID;
var scrollSpeed = 0;
var reader = {
    startScrolling: startScrolling,
    autoScroll: autoScroll,
    stopScrolling: stopScrolling,
    nextPage: nextPage,
    backPage: backPage,
    changePersist: changePersist
};

function startScrolling(request) {
    if (scrollSpeed == request.speed) { return true; }
    if (scrollIntervalID) { stopScrolling(); }
    chrome.storage.session.set({lastSpeed: request.speed});

    quickScroll(request);

    scrollSpeed = request.speed;
    return true;
}
function quickScroll(request) {
    let time = 400/request.speed;
    let distance = 1;
    scrollIntervalID = setInterval(function scroll(distance) { window.scrollBy(0, distance); }, time, distance);
    console.log("content-script: Started Scrolling" + ` | ${distance}px every ${time}ms`);
}
function autoScroll(request) {
    startScrolling(request);
    
    chrome.storage.session.set({ autoScrollTab: myTabId});
    // let newRequest = { for: "background", request: "addPersistentRequest", toRequest: { request: "startScrolling", speed: scrollSpeed }}
    // if (chrome.runtime?.id) {
    //     return chrome.runtime.sendMessage(newRequest);
    // }
}
function stopScrolling(request) {
    if (!scrollIntervalID) { return; }
    clearInterval(scrollIntervalID);
    scrollIntervalID = null;
    scrollSpeed = 0;
    console.log("content-script: Stopped Scrolling");

    chrome.storage.session.remove("autoScrollTab");
    // return chrome.runtime.sendMessage({ for: "background", request: "removePersistentRequest" });
}
function nextPage(request) {
    console.log("content-script: Next (TODO)");
    return false;
}
function backPage(request) {
    console.log("content-script: Back (TODO)");
}
function changePersist(request) {
    if (request.persist && scrollSpeed != 0) {
        return {request: "startScrolling", speed: scrollSpeed, persist: true}
    } else {
        return {};
    }
}


//Finished loading content script
chrome.runtime.sendMessage({for: "background", request: "returnMyTabId"})
.then((response) => {
    myTabId = response.tabId;
    
    onFullyLoaded();
},
(errorMessage) => console.log("Error: content-script did not receive myTabId.  " + errorMessage));

async function onFullyLoaded() {
    let autoScrollingTabId = await chrome.storage.session.get("autoScrollTab");
    if (myTabId != autoScrollingTabId["autoScrollTab"])
        return;
    let persistedScrollSpeed = await chrome.storage.session.get("lastSpeed");
    quickScroll({speed: persistedScrollSpeed.lastSpeed});
}