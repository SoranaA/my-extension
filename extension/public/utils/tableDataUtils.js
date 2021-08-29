function onDeleteKeyword(e) {
  const keyword = e.target.id.split("_")[1];
  let index = filterest.keywords.findIndex((element) => element === keyword);

  if (index > -1) {
    filterest.keywords.splice(index, 1);
  }

  filterest.displayKeywords();

  e.preventDefault();
  e.stopPropagation();
}

function onBlurKeywordInput(e) {
  filterest.updateKeywords();

  const keywords = filterest.keywords.filter((a) => a);
  filterest.keywords = keywords;

  filterest.displayKeywords();
}

function onRestoreElement(e) {
  let index = filterest.hiddenElements.findIndex(
    (element) => filterest.getSelector(element) === e.target.id
  );

  if (index > -1) {
    filterest.hiddenElements[index].classList.remove("filterest-hidden");
    filterest.hiddenElements.splice(index, 1);
  }

  filterest.updateElementsList();
  filterest.updateSavedElements();

  e.preventDefault();
  e.stopPropagation();
}

function onChangeRememberOption(e) {
  let index = filterest.hiddenElements.findIndex(
    (element) => filterest.getSelector(element) === e.target.id
  );

  filterest.hiddenElements[index].rememberHide = this.checked;

  filterest.updateSavedElements();
}

async function hideSimilarElementsOnClick(e) {
  e.preventDefault();

  await filterest.getKeywords();

  let hideButton = document.querySelector("#hideSimilarElements");
  hideButton.classList.add("filterest-hidden");
  let confirmHideButton = document.querySelector("#confirmHide");
  confirmHideButton.classList.add("filterest-hidden");
  let confirmButton = document.querySelector("#keywordsButtons");
  confirmButton.classList.remove("filterest-hidden");
}

function addKeywordOnClick(e) {
  e.preventDefault();

  filterest.keywords.push("");
  filterest.displayKeywords();

  document.getElementById("keyword_").focus();
}

function confirmHideSuggestedElements(e) {
  e.preventDefault();

  filterest.suggestedElements.forEach((element) => {
    element.classList.remove("filterest-background");
    element.classList.add("filterest-hidden");
    filterest.hiddenElements.push(element);
  });

  filterest.suggestedElements = [];
  filterest.updateElementsList();

  let confirmHideButton = document.querySelector("#confirmHide");
  confirmHideButton.classList.add("filterest-hidden");
  let hideButton = document.querySelector("#hideSimilarElements");
  hideButton.classList.remove("filterest-hidden");
}

function declineHideSuggestedElements(e) {
  e.preventDefault();

  filterest.suggestedElements.forEach((element) => {
    element.classList.remove("filterest-background");
  });

  filterest.suggestedElements = [];
  filterest.updateElementsList();

  let confirmHideButton = document.querySelector("#confirmHide");
  confirmHideButton.classList.add("filterest-hidden");
  let hideButton = document.querySelector("#hideSimilarElements");
  hideButton.classList.remove("filterest-hidden");
}
