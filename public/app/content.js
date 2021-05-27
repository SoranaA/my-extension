/*global chrome*/

//content script
var clickedElement;
var element;

document.addEventListener(
  "mousedown",
  function (event) {
    clickedElement = event.target;
  },
  true
);

document.addEventListener(
  "mouseover",
  function (event) {
    element = event.target;
    console.log(element.innerText);
  },
  true
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("content add listener");
  console.log(clickedElement);

  // display: none !important;
  clickedElement.remove();
});
