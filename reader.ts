// Define element that contains scroll speed
let speedElement = document.getElementById("scrollspeed") as HTMLInputElement;

function addEventListen(element: Element, action: string, request: String, parameters) {
    element.addEventListener(action, function() {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            // Determine the active tab, the tab we want to start scrolling
            var activeTab = tabs[0];
            
            // Retrieve the speed
            let speed = parameters[0].value;
            let persist = parameters[1];
            chrome.tabs.sendMessage(activeTab.id, { request: request, speed: speed, persist: persist})
            .then(() => {}, (err) => {
                chrome.runtime.sendMessage({ for: "background", request: "injectActiveTab", to: activeTab});
                setTimeout(chrome.tabs.sendMessage, 1000, activeTab.id, { request: request, speed: speed});
            });
        });
    })
}

// Define what events are associated with each button
const eventDict = [
    {action: "click", elementID: "scrollbutton", func: "startScrolling", parameter: [speedElement, false]},
    {action: "click", elementID: "autoscrollbutton", func: "startScrolling", parameter: [speedElement, true]},
    {action: "click", elementID: "stopscrollbutton", func: "startScrolling", parameter: [{value: 0}, true]}
];

// Add event listeners when called
function onPopup() {
    let elements = document.getElementById("menubar");
    let actionElements = document.getElementsByClassName("action");
    for (const event of eventDict) {
        const element = document.getElementById(event.elementID);
        addEventListen(element, event.action, event.func, event.parameter);
    }
    chrome.storage.session.get("lastSpeed")
    .then((lastSpeed) => {
        if (lastSpeed != null) {
            console.log(lastSpeed.lastSpeed);
            speedElement.setAttribute("value", lastSpeed.lastSpeed);
        }
    });
}
onPopup();
// TODO
// Implement multiple locations