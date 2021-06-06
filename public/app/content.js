/*global chrome*/

const filterest = {
  elementHovered: false,
  elementHighlighted: false,
  ancestorsNr: 0, // how far to travel up the line of ancestors
  isActive: false,

  addHighlight: function () {
    filterest.elementHighlighted.style.outline = "solid 2px red";
    filterest.elementHighlighted.style.outlineOffset = "-2px";
  },

  removeHighlight: function () {
    filterest.elementHighlighted.style.outline = "";
    filterest.elementHighlighted.style.outlineOffset = "";
  },

  highlightElement: function () {
    if (!filterest.elementHovered) return;

    if (filterest.elementHighlighted) {
      filterest.removeHighlight();
    }

    filterest.elementHighlighted = filterest.elementHovered;

    if (filterest.elementHighlighted.className === "filterest_overlay") {
      filterest.elementHighlighted =
        filterest.elementHighlighted.relatedElement;
    }

    let i = 0;
    for (i = 0; i < filterest.ancestorsNr; i++) {
      if (filterest.elementHighlighted.parentNode !== window.document) {
        filterest.elementHighlighted = filterest.elementHighlighted.parentNode;
      } else {
        break;
      }
    }

    filterest.ancestorsNr = i;
    filterest.addHighlight();
  },

  mouseover: function (e) {
    if (filterest.elementHovered !== e.target) {
      filterest.ancestorsNr = 0;
      filterest.elementHovered = e.target;
      filterest.highlightElement();
    }
  },

  hideTarget: function (e) {
    console.log(filterest.elementHighlighted);

    filterest.elementHighlighted.style.display = "none";
  },

  preventDefaultEvent: function (e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },

  activate: function () {
    filterest.isActive = true;

    document.addEventListener("mouseover", filterest.mouseover, true);
    document.addEventListener('mousedown', filterest.hideTarget, true);
    document.addEventListener('mouseup', filterest.preventDefaultEvent, true);
    document.addEventListener('click', filterest.preventDefaultEvent, true);

    chrome.extension.sendMessage({ action: "status", active: true });
  },

  deactivate: function () {
    filterest.isActive = false;

    document.removeEventListener("mouseover", filterest.mouseover, true);
    document.removeEventListener('mousedown', filterest.hideTarget, true);
    document.removeEventListener('mouseup', filterest.preventDefaultEvent, true);
    document.removeEventListener('click', filterest.preventDefaultEvent, true);

    if (filterest.elementHighlighted) {
      filterest.removeHighlight();
    }

    filterest.elementHighlighted = false;

    chrome.extension.sendMessage({ action: "status", active: false });
  },

  toggle: function () {
    if (filterest.isActive) filterest.deactivate();
    else filterest.activate();
  },

  init: function () {
    chrome.extension.onMessage.addListener(function (msg, sender, responseFun) {
      if (msg.action === "toggle") {
        filterest.toggle();
        responseFun(2.0);
      } else if (msg.action === "getStatus") {
        responseFun(filterest.isActive);
      }
    });
  },
};

filterest.init();
