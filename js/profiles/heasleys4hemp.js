// @version      1.0.0
// @description  Speciality addition to the owner of ReTorn
// @author       Heasleys4hemp [1468764]
(function() {
var obs = new MutationObserver(function(mutations) {
  if ($("div.user-information").length == 1 && $('.d .profile-wrapper .box-info .box-value .digit .two-row>span:first-child').length > 0) {
    let title = $('div.content-title').find('#skip-to-content').html();
    const particles = `
    <div class="particles___retorn">
    <div class="rotate___retorn">
    <div class="angle___retorn">
    <div class="size___retorn">
    <div class="position___retorn">
    <div class="pulse___retorn">
    <div class="particle___retorn"></div>
    </div>
    </div>
    </div>
    </div>
    <div class="angle___retorn">
    <div class="size___retorn">
    <div class="position___retorn">
    <div class="pulse___retorn">
    <div class="particle___retorn"></div>
    </div>
    </div>
    </div>
    </div>
    <div class="angle___retorn">
    <div class="size___retorn">
    <div class="position___retorn">
    <div class="pulse___retorn">
    <div class="particle___retorn"></div>
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>`;
    const crown = `<span class='re_crown' title='King of ReTorn'>👑${particles}</span> ${title}`;

    $('div.content-title').find('#skip-to-content').html(crown);
    $('.d .profile-wrapper .box-info .box-value .digit .two-row>span:first-child').text('Epic');

    obs.disconnect();
  }
});

obs.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
})();