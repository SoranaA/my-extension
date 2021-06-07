/*global chrome*/

const filterest = {
  elementHovered: false,
  elementHighlighted: false,
  isActive: false,
  hiddenElements: [],
  helpWindow: false,

  isChildOfHelpWindow: function (e) {
    while (e) {
      if (e === filterest.helpWindow) return true;
      return filterest.isChildOfHelpWindow(e.parentNode);
    }

    return false;
  },

  ignoreElement: function (e) {
    return e.tagName === "BODY"
      || e.tagName === "HTML"
      || this.isChildOfHelpWindow(e);
  },

  addHighlight: function () {
    filterest.elementHighlighted.style.outline = "solid 2px #de8a8a";
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

    if (filterest.ignoreElement(filterest.elementHovered)) return;

    filterest.elementHighlighted = filterest.elementHovered;
    filterest.addHighlight();
  },

  mouseover: function (e) {
    if (filterest.elementHovered !== e.target) {
      filterest.elementHovered = e.target;
      filterest.highlightElement();
    }
  },

  hideElement: function (e) {
    if (filterest.ignoreElement(filterest.elementHovered)) return;

    filterest.elementHighlighted.classList.add('filterest-hidden');
    filterest.hiddenElements.push(filterest.elementHighlighted);

    filterest.updateElementsList();
  },

  preventDefaultEvent: function (e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },

  getElementDisplayForTable: function (e) {
    if (e.innerText) {
      if (e.innerText.length > 100)
        return e.innerText.substring(0, 100) + '...'
      return e.innerText;
    }
    return e;
  },

  updateElementsList: function () {
    if (!filterest.helpWindow) return;

    let elemList = document.querySelector("#elements_list");
    let elementsHtml = [];

    if (filterest.hiddenElements.length) {
      elementsHtml.push(`<table><tr><th>Removed element</th><th>Remember</th><th></th></tr>`);

      filterest.hiddenElements.forEach(element => {
        elementsHtml.push(`<tr>
          <td>${filterest.getElementDisplayForTable(element)}</td>
          <td><input type="checkbox"></td>
          <td><button>Restore</button></td>
        </tr>`)
      });

      elementsHtml.push('</table>');
    }

    elemList.innerHTML = elementsHtml.join('\n');
  },

  activate: function () {
    filterest.isActive = true;

    let div = document.createElement('div');
    div.setAttribute('id', 'filterest_help_window');

    div.innerHTML = `
    <div id='filterest_help_window'>
      <h3>Filterest</h3>
      <button id="minimize">_</button>
      <div id="elements_list"></div>
    </div>
    `;

    div.querySelector('#minimize').addEventListener('click', function (e) {
      console.log("minimize clicked");
      div.classList.toggle('minimized');
      e.preventDefault();
    });

    document.body.appendChild(div);

    filterest.helpWindow = div;

    filterest.updateElementsList();

    document.addEventListener("mouseover", filterest.mouseover, true);
    document.addEventListener('mousedown', filterest.hideElement, true);
    document.addEventListener('mouseup', filterest.preventDefaultEvent, true);
    document.addEventListener('click', filterest.preventDefaultEvent, true);

    chrome.extension.sendMessage({ action: "status", active: true });
  },

  deactivate: function () {
    filterest.isActive = false;

    document.removeEventListener("mouseover", filterest.mouseover, true);
    document.removeEventListener('mousedown', filterest.hideElement, true);
    document.removeEventListener('mouseup', filterest.preventDefaultEvent, true);
    document.removeEventListener('click', filterest.preventDefaultEvent, true);

    if (filterest.elementHighlighted) {
      filterest.removeHighlight();
    }

    filterest.elementHighlighted = false;
    document.body.removeChild(filterest.helpWindow);

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
