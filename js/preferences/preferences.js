// @version      1.0.0
// @description  Add Sync button to preferences page for syncing APIKEY with extension
// @author       Heasleys4hemp [1468764]
insertHeader($("div.content-wrapper"), 'append');
$('#re_title').text("Sync");
$('.re_content').html(`
  <div class="re_row">
    <p id="re_signin_message">You are not signed into ReTorn. Please enter your api key then click sync.</p>
  </div>
  <div class="re_row">
    <div class="re_button_wrap">
      <input id="re_apikey" type="text" maxlength="16" required></input>
      <button class="re_torn_button" id="re_sync">Sync</button>
      <button class="re_torn_button" id="re_options">Options</button>
      <button class="re_torn_button" id="re_logout" hidden>Logout</button>
    </div>
  </div>
  <div class="re_row" hidden>
    <p id="re_message" hidden></p>
  </div>
  `);


chrome.runtime.sendMessage({name: "get_value", value: "re_api_key"}, (response) => {
  if (response.status != undefined) {
    if (response.status == true) {
      synced(response);
    } else {
      $("#re_sync").text("Sync");
      $("#re_sync").attr("disabled", false);
      $("#re_logout").attr("hidden", true);
      $("#re_apikey").show();
    }
  } else {
    errorMessage({status: false, message: "Unknown error."});
  }
});


  $("button#re_sync").click(() => {
    let key = $("#re_apikey").val();
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

  $("button#re_logout").click(function() {
  chrome.runtime.sendMessage({name: "logout"}, (response) => {
    console.log(response);
    if (response.status != undefined) {
      if (response.status == true) {
        $("#re_sync").text("Sync");
        $("#re_sync").attr("disabled", false);
        $("#re_logout").attr("hidden", true);
        $("#re_apikey").show();
        $("p#re_signin_message").text(`You are not signed into ReTorn. Please enter your api key then click sync.`);
        errorMessage({message: "You have been logged out."});
      } else {
        errorMessage(response);
      }
    } else {
      errorMessage({status: false, message: "Unknown error."});
    }
  });
});


function synced(response) {
  if (response.message != undefined) {
    $("#re_message").text(response.message);
    $("#re_message").attr('hidden', false);
    $("#re_message").parent().attr('hidden', false);
  }
  $("#re_sync").text("Synced!");
  $("#re_sync").attr("disabled", true);
  $("#re_sync").attr("hidden", false);
  $("#re_logout").attr("hidden", false);
  $("#re_apikey").hide();
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
