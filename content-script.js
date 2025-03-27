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
    nextPage: nextPage,
    backPage: backPage
};

function startScrolling(request) {
    // If speed requested is equivalent to current speed, exit.
    if (scrollSpeed == request.speed) { return true; }

    // If already scrolling, stop autoscroller in order to replace it. 
    if (scrollIntervalID) {
        clearInterval(scrollIntervalID);
        scrollIntervalID = null;
    }

    scrollSpeed = request.speed;

    // If opted in, save requested speed and current tabId in storage.
    if(request.persist) {
        chrome.storage.session.set({ autoScrollTab: myTabId});
        chrome.storage.session.set({lastSpeed: request.speed});
    }
    
    // If requested speed is 0, exit before instantiating scroller.
    if (request.speed == 0) { return true; }

    // Calculate scroll parameters from speed variable.
    let time = 400/request.speed;
    let distance = 1;
    // Start scrolling with setInterval.  Scrolls [distance] pixels downwards every [time] milliseconds.
    scrollIntervalID = setInterval(function scroll(distance) { window.scrollBy(0, distance); }, time, distance);
    console.log("content-script: Started Scrolling" + ` | ${distance}px every ${time}ms`);

    return true;
}

// Planned functions
function nextPage(request) {
    console.log("content-script: Next (TODO)");
    return false;
}
function backPage(request) {
    console.log("content-script: Back (TODO)");
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