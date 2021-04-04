/*global chrome*/

// chrome.runtime.onMessage.addListener((request) => {
//   console.log("Message received in background.js!", request);
// });

chrome.contextMenus.create({
  title: "Remove Element",
  id: "0",
  contexts: ["all"],
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  chrome.tabs.sendMessage(tab.id, {});
  console.log("background on click");
  console.log(info);
});
