"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        case "startScrolling":
            sendResponse(startScrolling(request));
            return;
        case "isReaderContentScriptHere?":
            sendResponse("Online Reader content-script is present.");
            return;
        case "trchecktoolbar": // TODO, maybe implement toolbar below bookmark bar
            console.log("content-script: Loading Online Reader Toolbar! (TODO)");
            sendResponse(false);
            return false;
        default:
            sendResponse("Unimplemented case: " + request.request);
    }
});
// Functions and variables part of reader tool.
// Navigate Section
var scrollIntervalID;
var scrollSpeed = 0;
function startScrolling(request) {
    // If speed requested is equivalent to current speed, exit.
    if (scrollSpeed == request.speed) {
        return true;
    }
    // If already scrolling, stop autoscroller in order to replace it. 
    if (scrollIntervalID) {
        clearInterval(scrollIntervalID);
        scrollIntervalID = null;
    }
    scrollSpeed = request.speed;
    // If opted in, save requested speed and current tabId in storage.
    if (request.persist) {
        chrome.storage.session.set({ autoScrollTab: myTabId });
        chrome.storage.session.set({ lastSpeed: request.speed });
    }
    // If requested speed is 0, exit before instantiating scroller.
    if (request.speed == 0) {
        return true;
    }
    // Calculate scroll parameters from speed variable.
    let time = 400 / request.speed;
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
chrome.runtime.sendMessage({ for: "background", request: "returnMyTabId" })
    .then((response) => {
    myTabId = response.tabId;
    onFullyLoaded();
}, (errorMessage) => console.log("Error: content-script did not receive myTabId.  " + errorMessage));
function onFullyLoaded() {
    return __awaiter(this, void 0, void 0, function* () {
        let autoScrollingTabId = yield chrome.storage.session.get("autoScrollTab");
        if (myTabId != autoScrollingTabId["autoScrollTab"])
            return;
        let persistedScrollSpeed = yield chrome.storage.session.get("lastSpeed");
        startScrolling({ speed: persistedScrollSpeed.lastSpeed, persist: false });
    });
}
