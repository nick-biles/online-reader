

function addEventListen(element: Element, action: string, request: String) {
    element.addEventListener(action, function() {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            var activeTab = tabs[0];
            let speed = document.getElementById("scrollspeed").value;
            chrome.tabs.sendMessage(activeTab.id, { request: request, speed: speed})
            .then(() => {}, (err) => {
                chrome.runtime.sendMessage({ for: "background", request: "injectActiveTab", to: activeTab});
                setTimeout(chrome.tabs.sendMessage, 1000, activeTab.id, { request: request, speed: speed});
            });
        });
    })
}

const eventDict = {scrollbutton: {click: ["startScrolling"]}, autoscrollbutton: {click: ["autoScroll"]}, stopscrollbutton: {click: ["stopScrolling"]}};
function onPopup() {
    let elements = document.getElementById("menubar");
    let actionElements = document.getElementsByClassName("action");
    for (const el of Array.from(actionElements)) {
        const elementEvents = eventDict[el.id];
        for (const key in elementEvents) {
            addEventListen(el, key, elementEvents[key]);
        }
    }
    chrome.storage.session.get("lastSpeed")
    .then((lastSpeed) => {
        if (lastSpeed) {
            console.log(lastSpeed.lastSpeed);
            document.getElementById("scrollspeed").setAttribute("value", lastSpeed.lastSpeed);
        }
    });
}
onPopup();
// TODO
// Implement multiple locations