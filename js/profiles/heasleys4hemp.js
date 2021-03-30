// @version      1.0.0
// @description  Speciality addition to the owner of ReTorn
// @author       Heasleys4hemp [1468764]

var obs = new MutationObserver(function(mutations) {
  if ($("div.user-information").length == 1) {
    let title = $('div.content-title').find('#skip-to-content').html();
    $('div.content-title').find('#skip-to-content').html("<span title='King of ReTorn'>👑</span> " + title);

    obs.disconnect();
  }
});

obs.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
