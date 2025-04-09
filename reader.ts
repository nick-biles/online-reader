// Define element that contains scroll speed
let speedElement = document.getElementById("scrollspeed") as HTMLInputElement;

function addEventListen(element: Element, action: string, request: String, parameters: [({ value: number; } | HTMLInputElement), boolean]) {
    element.addEventListener(action, function() {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            // Determine the active tab, the tab we want to start scrolling
            var activeTab = tabs[0];
            
            if(activeTab.id == undefined) {
                return -1;
            }
            // Retrieve the speed
            let speed = parameters[0].value;
            let persist = parameters[1];
            chrome.tabs.sendMessage(activeTab.id, { request: request, speed: speed, persist: persist})
            .then(() => {}, (err) => {
                // TODO: add proper error handling.  Currently we just assume there is no content script.
                chrome.runtime.sendMessage({ for: "background", request: "injectActiveTab", to: activeTab});
                setTimeout(chrome.tabs.sendMessage, 1000, activeTab.id, { request: request, speed: speed});
            });
        });
    })
}

// Define what events are associated with each button
const eventDict = [
    {action: "click", elementID: "scrollbutton", func: "startScrolling", parameter: [speedElement, false] as [HTMLInputElement, boolean]},
    {action: "click", elementID: "autoscrollbutton", func: "startScrolling", parameter: [speedElement, true] as [HTMLInputElement, boolean]},
    {action: "click", elementID: "stopscrollbutton", func: "startScrolling", parameter: [{value: 0}, true] as [{ value: number; }, boolean]}
]; // To prevent TS type errors, parameter value must be of type [({ value: number; } | HTMLInputElement), boolean]

// Add event listeners when called
function onPopup() {
    let elements = document.getElementById("menubar");
    let actionElements = document.getElementsByClassName("action");
    for (const event of eventDict) {
        const element = document.getElementById(event.elementID);
        if (element == null) {
            continue;
        }

        addEventListen(element, event.action, event.func, event.parameter);
    }
    chrome.storage.session.get("lastSpeed")
    .then((data) => {
        if (data.lastSpeed) {
            console.log("Retrieved stored speed: " + data.lastSpeed);
            speedElement.setAttribute("value", data.lastSpeed);
        }
    });
}
onPopup();
// TODO
// Implement multiple locations