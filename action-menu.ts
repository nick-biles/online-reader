// Define element that contains scroll speed
let speedElement = document.getElementById("scrollspeed") as HTMLInputElement;

// Add event handler when called
function addHandler(action: string, elementID: string, func: string, hasSpeed: ({ value: number; } | HTMLInputElement), persist: boolean) {
    const element = document.getElementById(elementID);
    if (element == null) {
        return;
    }

    element.addEventListener(action, function() {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            // Determine the active tab, the tab we want to start scrolling
            var activeTab = tabs[0];
            
            if(activeTab.id == undefined) {
                return -1;
            }

            // Retrieve the speed
            let speed = hasSpeed.value;

            chrome.tabs.sendMessage(activeTab.id, { request: func, speed: speed, persist: persist})
            .then(() => {}, (err) => {
                // Currently we assume there is no content script.
                chrome.runtime.sendMessage({ for: "background", request: "injectActiveTab", to: activeTab});
                setTimeout(chrome.tabs.sendMessage, 1000, activeTab.id, { request: func, speed: speed});
            });
        });
    })
}

// Define what events are associated with each button
addHandler("click", "scrollbutton", "startScrolling", speedElement, false);
addHandler("click", "autoscrollbutton", "startScrolling", speedElement, true);
addHandler("click", "stopscrollbutton", "startScrolling", {value: 0}, true);

// Retrieve the last stored speed for convenience.
chrome.storage.session.get("lastSpeed")
.then((data) => {
    if (data.lastSpeed) {
        console.log("Retrieved stored speed: " + data.lastSpeed);
        speedElement.setAttribute("value", data.lastSpeed);
    }
});