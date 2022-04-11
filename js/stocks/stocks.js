// @version      1.0.0
// @description  Add acronym to stocks, net change
// @author       Heasleys4hemp [1468764]

(function() {

  var observer = new MutationObserver(function(mutations, observer) {
    addAcros();
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (var i = 0; i < mutation.addedNodes.length; i++) {
          if (mutation.addedNodes[i].id && mutation.addedNodes[i].id == "panel-ManagerTab") {
            console.log(mutation);
            if (document.contains(document.getElementById('stockmarketroot'))) {
                addAcros();
            }

          }
        }
      }
    });


  });

  var target = document.getElementById('stockmarketroot');


  observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});


  function addAcros() {
    $('#stockmarketroot').find('div[class^="stockMarket"] ul[class^="stock"]').each( function() {
      if ($(this).data('acro') == undefined) {
        let logo = $(this).find('div[class^="logoContainer"]');
        let nameTab = $(this).find('li[class^="stockName"]');
        let acro = logo.find('img').attr('src').split('/').pop().split('.').shift();
        logo.find('img').attr('title', acro);
        nameTab.append(`<div class="re-acro">${acro}</div>`);
        $(this).data('acro', true);
      }
    });
  }

})();
