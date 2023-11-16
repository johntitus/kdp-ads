chrome.runtime.onMessage.addListener(
  function (message, sender, sendResponse) {
    if (message && message.message=='start') {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs[0]) {
          // chrome.tabs.sendMessage(tabs[0].id, {
          //   "message": "start"
          // });
        }
      });
    }
  }
);
chrome.tabs.onUpdated.addListener(function
  (tabId, changeInfo, tab) {
    if (changeInfo.url && changeInfo.url.indexOf("https://advertising.amazon.")==0) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            "changeURL": changeInfo.url
          });
        }
      });
    }
  }
);