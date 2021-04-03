// @version      1.0.0
// @description  Add quick busts, quick bail, jail filter, law firm speed busts
// @author       Heasleys4hemp [1468764]

insertHeader($("div.content-title"), 'after');
$('#re_title').text("Jail");
$('.re_content').html(`
  <div class="re_row">
  </div>
  `);

var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      for (var i = 0; i < mutation.addedNodes.length; i++) {
        if (mutation.addedNodes[i].classList && mutation.addedNodes[i].classList[0] == "specials-cont-wrap") {
          if ($('div.specials-cont-wrap > form[name="crimes"]:not([action="crimes.php?step=docrime"])').length > 0) {



          }
        }
      }
    }
  })
});

var target = document.querySelector('div.userlist-wrapper');
observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
