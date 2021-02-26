// @version      1.0.0
// @description  Add TornStats Graph and send updated battle stats to Tornstats
// @author       Heasleys4hemp [1468764]

$("div.content-wrapper").append(`
<div class="re_container">
  <div class="re_head">
    <span class="re_title">ReTorn: Torn Stats</span>
      <div class="re_icon_wrap">
        <span class="re_icon arrow_right">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32"><path d=""></path></svg>
        </span>
      </div>
  </div>

  <div class="re_content" hidden>
    <div class="re_row">

              <div id="faction_graphs"></div>

    </div>
    <div class="re_row">
      <div class="re_button_wrap">
        <button class="re_torn_button" id="re_tornstats_stats">Submit changes to Torn Stats</button>
        <button class="re_torn_button disabled" id="re_tornstats_stats">Disabled</button>
      </div>
    </div>
    <div class="re_row">
      <p id="re_message" hidden></p>
    </div>
  </div>
</div>
`);

$(".re_head").click(function() {
    $(this).toggleClass("expanded");
    $("div.re_content").slideToggle("fast");

    $("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
});

$("button#re_tornstats_stats").click(function() {
  $('p#re_message').text("This is a test.");
});
