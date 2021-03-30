// @version      1.0.0
// @description  Add quick busts, quick bail, jail filter, law firm speed busts
// @author       Heasleys4hemp [1468764]

insertHeader();

function insertHeader() {
  if ($('div.re_container').length == 0) {
    $("div.content-title").after(`
    <div class="re_container after">
      <div class="re_head expanded">
        <span class="re_title">ReTorn: Jail</span>
          <div class="re_icon_wrap">
            <span class="re_icon arrow_down">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32"><path d=""></path></svg>
            </span>
          </div>
      </div>

      <div class="re_content">
        <div class="re_row">

        </div>
      </div>
    </div>
    `);

    $(".re_head").click(function() {
        $(this).toggleClass("expanded");
        $("div.re_content").slideToggle("fast");

        $("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
    });
  }
}

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
