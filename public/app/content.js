/*global chrome*/

//content script
var clickedElement;

document.addEventListener(
  "mousedown",
  function (event) {
    clickedElement = event.target;
  },
  true
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("content add listener");
  console.log(clickedElement);

  // display: none !important;
  clickedElement.remove();
});
