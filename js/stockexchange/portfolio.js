// @version      1.0.0
// @description  Adds net change to stocks
// @author       Heasleys4hemp [1468764]

var portfolioNetChangeToggle = true;


var observer = new MutationObserver(function(mutations) {
    if (document.contains(document.querySelector('div.stock-main-wrap'))) {
        if (portfolioNetChangeToggle == true) {
          addNetChange();
        }
        observer.disconnect();
    }
});


observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});


function addNetChange() {
  $('ul.stock-cont > li.item-wrap').each(function() {
      let dir = '';
      let dirclass = '';
      let acro = $(this).data('stock');
      let info_tab = $(this).find('ul > li.info');

      let shares_tab = info_tab.find('div.b-price-wrap > div:contains("Shares:")');
      let shares = parseInt(shares_tab.text().replace(/\D/g,''));

      let length_wrap = info_tab.find('div.length-wrap');
      let change_span = length_wrap.find('span.change');

      if (length_wrap.find('span.change.down').length) {dir = '-';}else{dir = '+'}

      let change_tab = length_wrap.find('span.value');
      let change = change_tab.text().split(" ").shift().replace('$','').replace(',','');

      let net = Math.floor(change * shares);

      let qualify_wrap = info_tab.find('div.qualify-wrap');

      if (dir == '-') {dirclass = 'bold change down';}
      if (dir == '+') {dirclass = 'bold change up';}

      let netFormatted = net.toLocaleString('en-US');

      change_span.prop('title', 'Net Change: ' + dir + '$' + netFormatted);
      qualify_wrap.append('<div style="float: right;"><span class="bold">Net Change: </span><span class="'+dirclass+'">' + dir + '$' + netFormatted + '</span></div>');
  });
}
