/* eslint-disable no-restricted-globals */
/*global chrome*/

const filterest = {
  hoveredElement: false,
  markedElement: false,
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
    return (
      e.tagName === "BODY" ||
      e.tagName === "HTML" ||
      filterest.isChildOfHelpWindow(e)
    );
  },

  getSelector: function (element) {
    if (element.tagName === "BODY") return "body";
    if (element.tagName === "HTML") return "html";
    if (!element) return null;

    // https://stackoverflow.com/a/42184417
    var str = element.tagName;
    str += element.id !== "" ? "#" + element.id : "";

    if (element.className) {
      var classes = element.className.split(/\s/);
      for (var i = 0; i < classes.length; i++) {
        str += "." + classes[i];
      }
    }

    return filterest.getSelector(element.parentNode) + " > " + str;
  },

  preventEvent: function (e) {
    if (filterest.ignoreElement(e.target)) return;

    e.preventDefault();
    e.stopPropagation();
    return false;
  },

  highlightElement: function () {
    if (!filterest.hoveredElement) return;

    if (filterest.markedElement) {
      filterest.removeHighlightStyle(filterest.markedElement);
    }

    filterest.markedElement = filterest.hoveredElement;
    filterest.addHighlightStyle(filterest.markedElement);
  },

  addHighlightStyle: function (elm) {
    filterest.markedElement.style.outline = "solid 2px #de8a8a";
    filterest.markedElement.style.outlineOffset = "-2px";
  },

  removeHighlightStyle: function (elm) {
    filterest.markedElement.style.outline = "";
    filterest.markedElement.style.outlineOffset = "";
  },

  mouseover: function (e) {
    if (filterest.ignoreElement(e.target)) return;

    if (filterest.hoveredElement !== e.target) {
      filterest.hoveredElement = e.target;
      filterest.highlightElement();
    }
  },

  hideTarget: function (e) {
    if (filterest.ignoreElement(e.target)) return;

    let selector = filterest.getSelector(filterest.markedElement);

    if (!selector) return;

    filterest.hiddenElements.push({
      selector,
      innerText: e.target.innerText,
    });

    filterest.updateCSS();
    filterest.updateElementList();
    filterest.updateSavedElements();

    e.preventDefault();
    e.stopPropagation();
    return false;
  },

  updateCSS: function () {
    let cssLines = [
      `
			#ctre_wnd {
				position: fixed; bottom: 0; right: 10px; width: 360px; padding: 10px 20px;
				box-sizing: content-box;
				text-align: left; font-family: Helvetica, Arial, sans-serif;
				background: #fff; box-shadow: 0px 0px 40px rgba(0,0,0,0.15);
				z-index: 2147483647;
				font-size: 12px; color: #666;
			}
			#ctre_wnd * {
				line-height: 1.3; font-size: inherit; color: inherit;
				font-weight: normal; font-style: normal; font-family: inherit;
				cursor: default;
			}
			#ctre_wnd a, #ctre_wnd input[type=checkbox] { cursor: pointer; }

			#ctre_wnd .ct_minimize, #ctre_wnd .ct_close {
				display: block; cursor: pointer;
				position: absolute; top: 0; right: 0; width: 32px; line-height: 32px;
				font-size: 14px; text-align: center;
				transition: color 0.3s, background 0.3s;
			}
			#ctre_wnd .ct_minimize { right: 32px; background: #fff; color: #0fb4d4; }
			#ctre_wnd .ct_minimize:hover { background: #0fb4d4; color: #fff; }
			#ctre_wnd .ct_minimize i {
				display: inline-block; cursor: pointer;
				transform: rotate(45deg); transition: transform 0.5s;
			}
			#ctre_wnd .ct_close { color: #f00; background: #fff0f0; }
			#ctre_wnd .ct_close:hover { color: #fff; background: #f00; }
			#ctre_wnd .key {
				display: inline-block;
				font-family: monospace;
				background: #f7f7f7; color: #999;
				padding: 0 2px; margin: 0 2px;
				border: solid 1px #d5d5d5; border-radius: 3px;
			}
			#ctre_wnd .ct_logo { font-size: 15px; font-weight: bold; }
			#ctre_wnd .ct_logo.small { display: none; }
			#ctre_wnd .ct_logo svg {
				fill: #666; vertical-align: -15%;
				transform: rotate(-240deg); transition: transform 1s;
			}
			#ctre_wnd .ct_logo.anim svg { transform: rotate(0deg); }

			#ctre_wnd .version { color: #bbb; }
			#ctre_wnd .keys { font-size: 11px; overflow: hidden; margin-top: 4px; color: #bbb; }
			#ctre_wnd .activationKeys { float: left; margin-left: -2px; }

			#ctre_elm_list { display: none; margin: 0 -20px; background: #f7f7f7; border: solid 12px #f7f7f7; border-width: 12px 0 12px 0; max-height: 90px; overflow: auto; }
			#ctre_elm_list.hasContent { display: block; }
			#ctre_elm_list table { border: 0; width: 100%; border-spacing: 0; }
			#ctre_elm_list tr { border: 0; }
			#ctre_elm_list tr.ct_heading td { color: #bbb; }
			#ctre_elm_list td { padding: 0; border: 0; background: #f7f7f7; }
			#ctre_elm_list tr:nth-child(even) td { background: #fcfcfc; }
			#ctre_elm_list td:nth-child(1) { padding-left: 20px; }
			#ctre_elm_list td:nth-child(2) { text-align: center; }
			#ctre_elm_list td:nth-child(3) { padding-right: 20px; }
			#ctre_elm_list tr:not(.ct_heading) td:nth-child(1) { font-family: monospace; font-size: 11px; }
			#ctre_elm_list td input { display: inline; -webkit-appearance: checkbox; }
			#ctre_elm_list td input:before, #ctre_elm_list td input:after { content: none; }
			#ctre_elm_list a.ct_delete { color: #f00; padding: 4px; text-decoration: none; font-size: 14px; }
			#ctre_elm_list a.ct_delete:hover { color: #fff; background: #f00; }

			#ctre_wnd .ct_more { border-top: solid 1px #f7f7f7; margin: 0 -20px; padding-top: 12px; color: #bbb; font-size: 10px; text-align: center; }
			#ctre_wnd .ct_more a { color: #0fb4d4; font-size: inherit; text-decoration: none; transition: color 0.5s; }
			#ctre_wnd .ct_more a:hover { color: #000; }

			#ctre_wnd.minimized { width: 80px; height: 12px; }
			#ctre_wnd.minimized > * { display: none; }
			#ctre_wnd.minimized .ct_minimize,
			#ctre_wnd.minimized .ct_close { display: block; }
			#ctre_wnd.minimized .ct_minimize i { display: inline-block; transform: rotate(-135deg); }
			#ctre_wnd.minimized .ct_logo.small { display: block; margin: -4px 0 0 -10px; }
			`,
    ];

    for (let i in filterest.hiddenElements) {
      let selector = filterest.hiddenElements[i].selector;
      if (selector === "body" || selector === "html") {
        cssLines.push(selector + " { background: transparent !important; }");
      } else {
        cssLines.push(selector + " { display: none !important; }");
      }
    }

    let styleElm = document.querySelector("#ctre_styles");
    if (!styleElm) {
      styleElm = document.createElement("style");
      styleElm.type = "text/css";
      styleElm.id = "ctre_styles";
      document.head.appendChild(styleElm);
    }

    while (styleElm.firstChild) {
      styleElm.removeChild(styleElm.firstChild);
    }

    styleElm.appendChild(document.createTextNode(cssLines.join("\n")));
  },

  getElementDisplayForTable: function (e) {
    if (e.innerText) {
      if (e.innerText.length > 100)
        return e.innerText.substring(0, 100) + "...";
      return e.innerText;
    }
    return e;
  },

  updateElementList: function () {
    if (!filterest.helpWindow) return;

    let elmList = document.querySelector("#ctre_elm_list");
    let lines = [];

    if (filterest.hiddenElements.length) {
      lines.push(
        '<table><tr class="ct_heading"><td>Removed element</td><td>Remember</td><td></td></tr>'
      );

      for (let elm of filterest.hiddenElements) {
        lines.push(`<tr>
					<td class="ct_selector">
          ${filterest.getElementDisplayForTable(elm)}</td>
					<td><input type="checkbox"${elm.permanent ? " checked" : ""}></td>
					<td><a href="" class="ct_delete">Restore</a>
				</tr>`);
      }

      lines.push("</table>");
      elmList.classList.add("hasContent");
    } else {
      elmList.classList.remove("hasContent");
    }

    elmList.innerHTML = lines.join("\n");

    function onChangePermanent() {
      var tr = closest(this, "tr");
      let index = filterest.hiddenElements.findIndex(
        (elm) => elm.selector === tr.selector
      );
      var hiddenElement = filterest.hiddenElements[index];
      hiddenElement.permanent = this.checked;

      filterest.updateSavedElements();
    }

    function onDelete(e) {
      let tr = closest(this, "tr");

      if (tr.selector) {
        let index = filterest.hiddenElements.findIndex(
          (elm) => elm.selector === tr.selector
        );
        filterest.hiddenElements.splice(index, 1);
      }

      filterest.updateCSS();
      filterest.updateElementList();
      filterest.updateSavedElements();

      e.preventDefault();
      e.stopPropagation();
    }

    let i = -1;
    for (let tr of document.querySelectorAll("#ctre_elm_list table tr")) {
      if (i < 0) {
        // skip heading
        i++;
        continue;
      }

      tr.selector = filterest.hiddenElements[i].selector;

      tr.querySelector("input").addEventListener(
        "change",
        onChangePermanent,
        false
      );
      tr.querySelector("a.ct_delete").addEventListener(
        "click",
        onDelete,
        false
      );

      i++;
    }
  },

  updateSavedElements: function () {
    chrome.extension.sendMessage({
      action: "set_saved_elms",
      website: location.hostname.replace(/^www\./, ""),
      data: JSON.stringify(
        filterest.hiddenElements.filter((elm) => elm.permanent)
      ),
    });
  },

  loadSavedElements: function () {
    chrome.extension.sendMessage(
      {
        action: "get_saved_elms",
        website: location.hostname.replace(/^www\./, ""),
      },
      function (data) {
        filterest.hiddenElements = JSON.parse(data);

        filterest.updateCSS();
        filterest.updateElementList();
      }
    );
  },

  activate: function () {
    if (!filterest.helpWindow) filterest.updateCSS();

    let div = document.createElement("div");
    div.setAttribute("id", "ctre_wnd");
    document.body.appendChild(div);
    div.innerHTML = `
			<span class="ct_logo">Filterest</span>
			<div class="ct_minimize"><i>➜</i></div>
			<div class="ct_separator"></div>
			<div id="ctre_elm_list"></div>
		`;

    div.querySelector(".ct_minimize").addEventListener("click", function (e) {
      div.classList.toggle("minimized");
      e.preventDefault();
    });

    for (let elm of div.querySelectorAll(".ct_more a")) {
      elm.addEventListener("click", function (e) {
        filterest.deactivate();
      });
    }

    filterest.helpWindow = div;

    filterest.updateElementList();

    filterest.isActive = true;
    document.addEventListener("mouseover", filterest.mouseover, true);
    document.addEventListener("mousemove", filterest.mousemove);
    document.addEventListener("mousedown", filterest.hideTarget, true);
    document.addEventListener("mouseup", filterest.preventEvent, true);
    document.addEventListener("click", filterest.preventEvent, true);

    filterest.helpWindow.style.display = "block";

    chrome.extension.sendMessage({ action: "status", active: true });

    setTimeout(function () {
      let logoElm = document.querySelector("#ctre_wnd .logo");
      logoElm && logoElm.classList.add("anim");
    }, 10);
  },

  deactivate: function () {
    filterest.isActive = false;

    if (filterest.markedElement) {
      filterest.removeHighlightStyle(filterest.markedElement);
    }
    filterest.markedElement = false;

    filterest.helpWindow.parentNode.removeChild(filterest.helpWindow);

    document.removeEventListener("mouseover", filterest.mouseover, true);
    document.removeEventListener("mousemove", filterest.mousemove);
    document.removeEventListener("mousedown", filterest.hideTarget, true);
    document.removeEventListener("mouseup", filterest.preventEvent, true);
    document.removeEventListener("click", filterest.preventEvent, true);

    chrome.extension.sendMessage({ action: "status", active: false });
  },

  toggle: function () {
    if (filterest.isActive) filterest.deactivate();
    else filterest.activate();
  },

  init: function () {
    document.addEventListener("keydown", filterest.keyDown);
    document.addEventListener("keyup", filterest.keyUp);

    chrome.extension.onMessage.addListener(function (msg, sender, responseFun) {
      if (msg.action === "toggle") {
        filterest.toggle();
        responseFun(2.0);
      } else if (msg.action === "getStatus") {
        responseFun(filterest.isActive);
      }
    });

    filterest.loadSavedElements();
  },
};

filterest.init();

function closest(el, selector) {
  var retval = null;
  while (el) {
    if (el.matches(selector)) {
      retval = el;
      break;
    }
    el = el.parentElement;
  }
  return retval;
}
