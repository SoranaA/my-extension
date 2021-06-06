/*global chrome*/

function setActive() {
  chrome.browserAction.setIcon({ path: "logo/logo16.png" });
  chrome.browserAction.setTitle({ title: "Filterest (active)" });
}

function setInactive() {
  chrome.browserAction.setIcon({ path: "logo/logo16_inactive.png" });
  chrome.browserAction.setTitle({ title: "Filterest" });
}

function checkActive() {
  chrome.tabs.getSelected(null, function (tab) {
    if (!tab || tab.id < 0) return; // not really a tab, most likely a devtools window

    if (tab.url.substr(0, 4) !== "http") {
      chrome.browserAction.setIcon({ path: "logo/logo16_inactive.png" });
      chrome.browserAction.setTitle({
        title: "Filterest (unavailable for this tab)",
      });
      chrome.browserAction.disable(tab.id);
      return;
    } else {
      chrome.browserAction.enable(tab.id);
    }

    chrome.tabs.sendMessage(
      tab.id,
      { action: "getStatus" },
      function (isActive) {
        if (chrome.runtime.lastError) return;

        if (isActive) {
          setActive();
        } else {
          setInactive();
        }
      }
    );
  });
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
  checkActive();
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  checkActive();
});

chrome.browserAction.onClicked.addListener(function () {
  chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle" }, function (response) {
      if (chrome.runtime.lastError) {
        // lastError needs to be checked, otherwise Chrome may throw an error
        return;
      }

      if (!response) {
        chrome.tabs.executeScript(tab.id, {
          code: "if (confirm('This tab was loaded before Filterest was installed and you should reload it to be able to use the extension.\\nThis is necessary only the first time.')) location.reload();",
        });
      }
    });
  });
});

chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === 'status' && msg.active === true) {
    setActive();
  } else if (msg.action === 'status' && msg.active === false) {
    setInactive();
  }
});

checkActive();

