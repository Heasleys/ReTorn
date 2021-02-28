// @version      1.0.0
// @description  Add Sync button to preferences page for syncing APIKEY with extension
// @author       Heasleys4hemp [1468764]
insertHeader();

chrome.storage.sync.get(['re_api_key'], function(result) {
  console.log(result);
  console.log(result.re_api_key);
  if (result != undefined && result.re_api_key != undefined) {
    synced();
  } else {
    $("#re_sync").text("Sync");
    $("#re_sync").attr("disabled", false);
  }
});

function insertHeader() {
  $("div.content-wrapper").append(`
  <div class="re_container">
    <div class="re_head">
      <span class="re_title">ReTorn</span>
        <div class="re_icon_wrap">
          <span class="re_icon arrow_right">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32"><path d=""></path></svg>
          </span>
        </div>
    </div>

    <div class="re_content" hidden>
      <div class="re_row">

      <p id="re_signin_message">You are not signed into ReTorn. Please click below to sync apikey.</p>

      </div>
      <div class="re_row">
        <div class="re_button_wrap">
          <button class="re_torn_button" id="re_sync">Sync</button>
          <button class="re_torn_button" id="re_options">Options</button>
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

  $("button#re_sync").click(function() {
    let key = $("div#api > div > form > input#newapi").val();
    chrome.storage.sync.set({"re_api_key": key}, function() {
      $("p#re_message").text(key);
      synced();
    });
  });

  $("button#re_options").click(function() {
    chrome.runtime.sendMessage({name: "open_options"});
  });
}

function synced() {
  $("#re_sync").text("Synced!");
  $("#re_sync").attr("disabled", true);
  $("#re_sync").attr("hidden", false);
  $("p#re_signin_message").text("Welcome {user}! You are signed in.");
}
