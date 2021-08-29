/* eslint-disable no-restricted-globals */
/*global chrome*/

const filterest = {
  elementHovered: false,
  elementHighlighted: false,
  isActive: false,
  hiddenElements: [],
  keywords: [],
  suggestedElements: [],
  helpWindow: false,

  init: function () {
    chrome.extension.onMessage.addListener(function (
      msg,
      sender,
      responseFunction
    ) {
      if (msg.action === "toggle") {
        filterest.toggle();
        responseFunction(2.0);
      } else if (msg.action === "getStatus") {
        responseFunction(filterest.isActive);
      }
    });

    filterest.loadSavedElements();
  },

  toggle: function () {
    if (filterest.isActive) filterest.deactivate();
    else filterest.activate();
  },

  activate: function () {
    filterest.isActive = true;

    let div = document.createElement("div");
    div.setAttribute("id", "filterest_help_window");

    div.innerHTML = `
      <h3 class="filterest-heading">Filterest</h3>
      <button id="minimize">↘</button>
      <div id="elements_list" class="table100 ver1"></div>
      <br/>
      <div>
        <button id="hideSimilarElements" class="filterest-button">Hide similar elements</button>
        <div id="keywordsButtons" class="filterest-hidden">
          <button id="confirmKeywords" class="filterest-button">Confirm keywords</button>
          <button id="addKeyword" class="filterest-button" style="float: right;">Add Keyword</button>
        </div>
        <div id="confirmHide" class="filterest-hidden">
          <p style="color: red;">Do you want to hide suggested elements?</p>
          <button id="filterestNo" class="filterest-button filterest-right">No</button>
          <button id="filterestYes" class="filterest-button filterest-right" style="margin-right: 45px;">Yes</button>
        </div>
      </div>
    `;

    div.querySelector("#minimize").addEventListener("click", function (e) {
      e.preventDefault();

      div.classList.toggle("minimized");

      if (this.innerHTML === "↘") {
        this.innerHTML = "↖";
      } else {
        this.innerHTML = "↘";
      }
    });

    div
      .querySelector("#hideSimilarElements")
      .addEventListener("click", hideSimilarElementsOnClick);

    div
      .querySelector("#addKeyword")
      .addEventListener("click", addKeywordOnClick);

    div
      .querySelector("#confirmKeywords")
      .addEventListener("click", confirmKeywords);

    div
      .querySelector("#filterestYes")
      .addEventListener("click", confirmHideSuggestedElements);

    div
      .querySelector("#filterestNo")
      .addEventListener("click", declineHideSuggestedElements);

    document.body.appendChild(div);

    filterest.helpWindow = div;

    filterest.updateElementsList();

    document.addEventListener("mouseover", filterest.mouseover, true);
    document.addEventListener("mousedown", filterest.hideElement, true);
    document.addEventListener("mouseup", filterest.preventDefaultEvent, true);
    document.addEventListener("click", filterest.preventDefaultEvent, true);

    chrome.extension.sendMessage({ action: "status", active: true });
  },

  deactivate: function () {
    filterest.isActive = false;

    document.removeEventListener("mouseover", filterest.mouseover, true);
    document.removeEventListener("mousedown", filterest.hideElement, true);
    document.removeEventListener(
      "mouseup",
      filterest.preventDefaultEvent,
      true
    );
    document.removeEventListener("click", filterest.preventDefaultEvent, true);

    if (filterest.elementHighlighted) {
      filterest.removeHighlight();
    }

    filterest.elementHighlighted = false;
    document.body.removeChild(filterest.helpWindow);

    chrome.extension.sendMessage({ action: "status", active: false });
  },

  loadSavedElements: function () {
    chrome.extension.sendMessage(
      {
        action: "get_saved_elements",
        website: location.hostname.replace(/^www\./, ""),
      },
      function (data) {
        var elements = JSON.parse(data);

        elements.forEach((element) => {
          var tagElements = document.querySelectorAll(element.tagName);

          tagElements.forEach((e) => {
            if (filterest.getSelector(e) === element.selector) {
              e.classList.add("filterest-hidden");
              e.rememberHide = true;
              e.selector = element.selector;
              filterest.hiddenElements.push(e);
            }
          });
        });

        filterest.updateElementsList();
      }
    );
  },

  updateElementsList: function () {
    if (!filterest.helpWindow) return;

    let elemList = document.querySelector("#elements_list");
    let elementsHtml = [];

    elementsHtml.push(
      `<table><tr><th>Removed element</th><th>Remember</th><th></th></tr>`
    );

    if (filterest.hiddenElements.length) {
      filterest.hiddenElements.forEach((element) => {
        elementsHtml.push(`<tr>
          <td>${filterest.getElementDisplayNameForTable(element)}</td>
          <td><input type="checkbox" 
            id="${filterest.getSelector(element)}"
            ${element.rememberHide ? " checked" : ""}></td>
          <td><button 
            title="Restore"
            id="${filterest.getSelector(element)}"
            class="filterest-button filterest_restore">↺</button></td>
        </tr>`);
      });
    } else {
      elementsHtml.push(`<tr>
          <td colspan="3" style="padding: 35px;">No elements hidden yet. Click on the elements you want to hide.</td>          
        </tr>`);
    }

    elementsHtml.push("</table>");

    elemList.innerHTML = elementsHtml.join("\n");

    if (filterest.hiddenElements.length) {
      let i = -1;
      for (let tr of document.querySelectorAll("#elements_list table tr")) {
        if (i < 0) {
          // skip heading
          i++;
          continue;
        }

        tr.querySelector(".filterest_restore").addEventListener(
          "click",
          onRestoreElement,
          false
        );
        tr.querySelector("input").addEventListener(
          "change",
          onChangeRememberOption,
          false
        );

        i++;
      }
    }

    let hideButton = document.querySelector("#hideSimilarElements");

    if (filterest.hiddenElements.length >= 3) {
      hideButton.classList.remove("filterest-hidden");
    } else {
      hideButton.classList.add("filterest-hidden");
    }
  },

  updateSavedElements: function () {
    let elementsToRemember = filterest.hiddenElements.filter(
      (e) => e.rememberHide === true
    );

    var elementsAsJson = [];

    elementsToRemember.forEach((element) => {
      var html = element.outerHTML;
      var data = { selector: element.selector, tagName: element.tagName };
      elementsAsJson.push(data);
    });

    chrome.extension.sendMessage({
      action: "set_saved_elements",
      website: location.hostname.replace(/^www\./, ""),
      data: JSON.stringify(elementsAsJson),
    });
  },

  getKeywords: async function () {
    if (filterest.keywords.length < 1) {
      let allHiddenText = "";
      filterest.hiddenElements.forEach((element) => {
        allHiddenText += element.innerText;
        allHiddenText += " ";
      });

      allHiddenText = allHiddenText
        .replace(/\n/g, "")
        .replace(/ +(?= )/g, "")
        .trim();

      const requestOptions = {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: allHiddenText }),
      };

      await fetch("https://localhost:44340/keywordfinder", requestOptions)
        .then((response) => response.json())
        .then((data) => {
          filterest.keywords = data;
        });
    }

    filterest.displayKeywords();
  },

  updateKeywords: function () {
    let currentKeywords = [];

    let i = -1;
    for (let tr of document.querySelectorAll("#elements_list table tr")) {
      if (i < 0) {
        // skip heading
        i++;
        continue;
      }

      currentKeywords.push(tr.querySelector("input").value);
      i++;
    }

    filterest.keywords = currentKeywords;
  },

  displayKeywords: function () {
    if (!filterest.helpWindow) return;

    let elemList = document.querySelector("#elements_list");
    let keywordsHtml = [];

    keywordsHtml.push(`<table><tr><th>Keyword</th><th></th></tr>`);

    if (filterest.keywords.length) {
      filterest.keywords.forEach((keyword) => {
        keywordsHtml.push(`<tr>
        <td><input type="text" id="keyword_${keyword}" class="filterest-keywordInput" value="${keyword}"></td>
        <td align="right"><button 
          title="Remove"
          id="removeKeyword_${keyword}"
          class="filterest_removeKeyword filterest-button">x</button></td>
      </tr>`);
      });
    } else {
      keywordsHtml.push(`<tr>
          <td colspan="2" style="padding: 35px;">No keywords found. You can add some keywords.</td>          
        </tr>`);
    }

    keywordsHtml.push("</table>");

    elemList.innerHTML = keywordsHtml.join("\n");

    if (filterest.keywords.length) {
      let i = -1;
      for (let tr of document.querySelectorAll("#elements_list table tr")) {
        if (i < 0) {
          // skip heading
          i++;
          continue;
        }

        tr.querySelector(".filterest_removeKeyword").addEventListener(
          "click",
          onDeleteKeyword,
          false
        );

        tr.querySelector(".filterest-keywordInput").addEventListener(
          "blur",
          onBlurKeywordInput
        );

        i++;
      }
    }

    let confirmKeywordsButton = document.querySelector("#confirmKeywords");

    if (filterest.keywords.length >= 1) {
      confirmKeywordsButton.classList.remove("filterest-hidden");
    } else {
      confirmKeywordsButton.classList.add("filterest-hidden");
    }
  },

  getElementDisplayNameForTable: function (e) {
    if (e.innerText) {
      const text = e.innerText
        .replace(/\n/g, "")
        .replace(/ +(?= )/g, "")
        .trim();

      if (text.length > 50) return text.substring(0, 100) + "...";
      return text;
    }

    return e;
  },

  hideElement: function (e) {
    if (filterest.ignoreElement(filterest.elementHovered)) return;

    filterest.elementHighlighted.selector = filterest.getSelector(
      filterest.elementHighlighted
    );

    filterest.elementHighlighted.classList.add("filterest-hidden");
    filterest.hiddenElements.push(filterest.elementHighlighted);

    filterest.updateElementsList();
    filterest.updateSavedElements();
  },

  ignoreElement: function (e) {
    return (
      e.tagName === "BODY" ||
      e.tagName === "HTML" ||
      filterest.isChildOfHelpWindow(e)
    );
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

  preventDefaultEvent: function (e) {
    if (filterest.isChildOfHelpWindow(e.target)) return;

    e.preventDefault();
    e.stopPropagation();
    return false;
  },

  isChildOfHelpWindow: function (e) {
    while (e) {
      if (e === filterest.helpWindow) return true;
      return filterest.isChildOfHelpWindow(e.parentNode);
    }

    return false;
  },

  getSelector: function (element) {
    if (element.tagName == "BODY") return "body";
    if (element.tagName == "HTML") return "html";
    if (!element) return null;

    return cssFinder(element, {
      seedMinLength: 3,
      optimizedMinLength: 1,
    });
  },

  // getSelector: function (element) {
  //   if (element.tagName === "BODY") return "body";
  //   if (element.tagName === "HTML") return "html";
  //   if (!element) return null;

  //   // https://stackoverflow.com/a/49663134
  //   let path = [], parent;

  //   while (parent = element.parentNode) {
  //     path.unshift(`${element.tagName}:nth-child(${[].indexOf.call(parent.children, element)+1})`);
  //     element = parent;
  //   }

  //   return `${path.join(' > ')}`.toLowerCase();
  // },
};

filterest.init();
