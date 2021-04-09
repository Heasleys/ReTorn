// @version      1.0.0
// @description  Add acronym to stocks, net change
// @author       Heasleys4hemp [1468764]

(function() {

  var portfolioNetChangeToggle = true;

  var observer = new MutationObserver(function(mutations, observer) {
    addAcros();
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (var i = 0; i < mutation.addedNodes.length; i++) {
          if (mutation.addedNodes[i].id && mutation.addedNodes[i].id == "panel-ManagerTab") {
            console.log(mutation);
            if (document.contains(document.getElementById('stockmarketroot'))) {
                addAcros();
                if (portfolioNetChangeToggle == true) {
                  if ($('div[class*="transactionsList"]').length > 0) {
                    //addNetChange();
                  }
                }
            }

          }
        }
      }
    });


  });

  var target = document.getElementById('stockmarketroot');


  observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});


  function addNetChange() {
    console.log("test 1");
    $('div[class*="transactionsList"]').each(function() {
      console.log("test");
      console.log($(this));
        // let dir = '';
        // let dirclass = '';
        // let acro = $(this).data('stock');
        // let info_tab = $(this).find('ul > li.info');
        //
        // let shares_tab = info_tab.find('div.b-price-wrap > div:contains("Shares:")');
        // let shares = parseInt(shares_tab.text().replace(/\D/g,''));
        //
        // let length_wrap = info_tab.find('div.length-wrap');
        // let change_span = length_wrap.find('span.change');
        //
        // if (length_wrap.find('span.change.down').length) {dir = '-';}else{dir = '+'}
        //
        // let change_tab = length_wrap.find('span.value');
        // let change = change_tab.text().split(" ").shift().replace('$','').replace(',','');
        //
        // let net = Math.floor(change * shares);
        //
        // let qualify_wrap = info_tab.find('div.qualify-wrap');
        //
        // if (dir == '-') {dirclass = 'bold change down';}
        // if (dir == '+') {dirclass = 'bold change up';}
        //
        // let netFormatted = net.toLocaleString('en-US');
        //
        // change_span.prop('title', 'Net Change: ' + dir + '$' + netFormatted);
        // qualify_wrap.append('<div style="float: right;"><span class="bold">Net Change: </span><span class="'+dirclass+'">' + dir + '$' + netFormatted + '</span></div>');
    });
  }

  function addAcros() {
    $('#stockmarketroot').find('div[class^="stockMarket"] ul[class^="stock"]').each( function() {
      if ($(this).data('acro') == undefined) {
        let logo = $(this).find('div[class^="logoContainer"]');
        let name = $(this).find('div[class^="nameContainer"]');
        let acro = logo.find('img').attr('src').split('/').pop().split('.').shift();
        logo.find('img').attr('title', acro);
        name.text(name.text() + ' ['+acro+']');
        $(this).data('acro', true);
      }
    });
  }

})();
