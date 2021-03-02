// @version      1.0.0
// @description  Add Sync button to preferences page for syncing APIKEY with extension
// @author       Heasleys4hemp [1468764]
insertHeader();

chrome.runtime.sendMessage({name: "get_value", value: "re_api_key"}, (response) => {
  if (response.status != undefined) {
    if (response.status == true) {
      synced(response);
    } else {
      $("#re_sync").text("Sync");
      $("#re_sync").attr("disabled", false);
    }
  } else {
    errorMessage({status: false, message: "Unknown error."});
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

    <div class="re_content" style="display: none;">
      <div class="re_row">

      <p id="re_signin_message">You are not signed into ReTorn. Please click below to sync apikey.</p>

      </div>
      <div class="re_row">
        <div class="re_button_wrap">
          <button class="re_torn_button" id="re_sync">Sync</button>
          <button class="re_torn_button" id="re_options">Options</button>
        </div>
      </div>
      <div class="re_row" hidden>
        <p id="re_message" hidden></p>
      </div>
    </div>
  </div>
  `);

  $(".re_head").click(() => {
      $(this).toggleClass("expanded");
      $("div.re_content").slideToggle("fast");
      $("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
  });

  $("button#re_sync").click(() => {
    let key = $("div#api > div > form > input#newapi").val();
    chrome.runtime.sendMessage({name: "set_api", apikey: key}, (response) => {
      console.log(response);
      if (response.status != undefined) {
        if (response.status == true) {
          synced(response);
        } else {
          errorMessage(response);
        }
      } else {
        errorMessage({status: false, message: "Unknown error."});
      }
    });
  });

  $("button#re_options").click(() => {
    chrome.runtime.sendMessage({name: "open_options"});
  });
}

function synced(response) {
  if (response.message != undefined) {
    $("#re_message").text(response.message);
    $("#re_message").attr('hidden', false);
    $("#re_message").parent().attr('hidden', false);
  }
  $("#re_sync").text("Synced!");
  $("#re_sync").attr("disabled", true);
  $("#re_sync").attr("hidden", false);
  chrome.runtime.sendMessage({name: "get_value", value: "re_user"}, (response) => {
    console.log(response);
    if (response.status == true && response.value.re_user.name != undefined) {
      $("p#re_signin_message").text(`Welcome ${response.value.re_user.name}! You are signed in.`);
    }
  });
}

function errorMessage(error) {
  console.log(error);
  $("#re_message").text(error.message);
  $("#re_message").attr('hidden', false);
  $("#re_message").parent().attr('hidden', false);
}
