const getParentNodesWithAtLeastTwoChilds = function (elements) {
    const parentNodesToCheck = [];

    elements.forEach(element => {
      if (!parentNodesToCheck.find(elem => filterest.getSelector(element.parentNode) === filterest.getSelector(elem))) {
        parentNodesToCheck.push(element.parentNode);
      }
    });

    let searchParents = true;
    while(searchParents) {
      let elementsWithOneChild = parentNodesToCheck.filter(element => element.children.length <= 1);
      
      if(elementsWithOneChild.length > 0) {
        elementsWithOneChild.forEach(e => {
          let index = parentNodesToCheck.findIndex(
            (element) => filterest.getSelector(element) === filterest.getSelector(e)
          );
  
          parentNodesToCheck.splice(index, 1);
          if (!parentNodesToCheck.find(elem => filterest.getSelector(e.parentNode) === filterest.getSelector(elem))) {
            parentNodesToCheck.push(e.parentNode);
          }
        })
      } else {
        searchParents = false;
      }
    }

    return parentNodesToCheck;
}

const confirmKeywords = async function (e) {
    e.preventDefault();

    filterest.updateKeywords();

    let parentNodesToCheck = getParentNodesWithAtLeastTwoChilds(filterest.hiddenElements);
    await searchChildsToHide(parentNodesToCheck);

    const foundOnFirstTry = filterest.suggestedElements.length > 0;

    while (filterest.suggestedElements.length === 0 && !parentNodesToCheck.find(p => p.tagName === "BODY")) {
        parentNodesToCheck = getParentNodesWithAtLeastTwoChilds(parentNodesToCheck);
        await searchChildsToHide(parentNodesToCheck);
    }

    if (!foundOnFirstTry && filterest.suggestedElements.length > 0) {        
        let foundElements = filterest.suggestedElements;
        filterest.suggestedElements = [];
        await searchChildsToHide(foundElements);
    }

    filterest.suggestedElements.forEach(suggestedElement => {
        suggestedElement.classList.add('filterest-background');
    });

    if(filterest.suggestedElements.length > 0) {
        let confirmHideButton = document.querySelector('#confirmHide');
        confirmHideButton.classList.remove('filterest-hidden');
        let hideButton = document.querySelector("#hideSimilarElements");
        hideButton.classList.add("filterest-hidden");  
      }
      else {
        alert('No similar elements were found based on the current keywords');
        let confirmHideButton = document.querySelector('#confirmHide');
        confirmHideButton.classList.add('filterest-hidden');
        let hideButton = document.querySelector("#hideSimilarElements");
        hideButton.classList.remove("filterest-hidden");
        filterest.updateElementsList();
      }
      
      let confirmButton = document.querySelector("#keywordsButtons");
      confirmButton.classList.add("filterest-hidden");
}

const searchChildsToHide = async function (parentNodesToCheck) {
    let elementsToSend = [];
    let htmlElementsToSent = [];

    parentNodesToCheck.forEach(e => {
      const childs = [].slice.call(e.children);
      childs.forEach(child => {
        elementsToSend.push({ selector: filterest.getSelector(child), innerText: child.innerText.replace(/\n/g, '').replace(/ +(?= )/g,'').trim() });
        htmlElementsToSent.push(child);
      });
    });

    const requestOptions = {
      method: 'POST',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ elements: elementsToSend, keywords: filterest.keywords 
      })
    };
    
    await fetch("https://localhost:44340/keywordfinder/similarElements", requestOptions)
        .then(response => response.json())
        .then(data => {
          data.forEach(elementSelector => {
            var suggestedElement = htmlElementsToSent.find(e => filterest.getSelector(e) === elementSelector);
            
            if(!suggestedElement.classList.contains('filterest-hidden')){
              filterest.suggestedElements.push(suggestedElement);
            }
          });
        });
  }