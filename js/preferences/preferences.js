(function() {

insertHeader($("div.content-wrapper"), 'append', 'connect');
$('.re_settings_icon').remove();
$('.re_content').html(`
  <div class="re_row">
    <p id="re_signin_message">You are not signed into ReTorn. Please enter your api key then click connect.</p>
  </div>
  <div class="re_row">
    <div class="re_button_wrap">
      <input id="re_apikey" type="text" maxlength="16" required autocomplete="off">
      <button class="re_torn_button" id="re_sync">Connect</button>
      <button class="re_torn_button" id="re_options">Options</button>
      <button class="re_torn_button" id="re_logout" hidden>Logout</button>
    </div>
  </div>
  <div class="re_row" hidden>
    <p id="re_message" hidden></p>
  </div>
  `);

  $("button#re_sync").click(() => {
    const key = $("#re_apikey").val();
    if (key && key.length == 16) {
        sendMessage({name: "set_api", apikey: key})
        .then((r) => {
            console.log(r)
        if (r.status) {
            $("#re_message").attr('hidden', true);
            $("#re_message").parent().attr('hidden', true);
            isSynced(r);
        } else {
            errorMessage({status: false, message: r.message});
        }
        })
        .catch((error) => errorMessage(error));
    } else {
        errorMessage({status: false, message: "Please enter a valid apikey."});
    }
  });

  $("button#re_logout").click(function() {
    sendMessage({name: "logout"})
    .then((r) => {
        if (r.status) {
            signedOut();
            errorMessage({message: r.message});
        } else {
            errorMessage(response);
        }
    }).catch((error) => errorMessage(error));
});



sendMessage({name: "get_local", value: "re_apikey"})
.then((r) => {
    console.log(r);
    isSynced(r);
})
.catch((e) => console.error(e))


function isSynced(r) {
 if (r.status) {
    sendMessage({name: "get_local", value: "re_user"})
    .then((rr) => {
        $("#re_signin_message").text(`Welcome ${rr?.data?.name}! You are signed in.`);
    })
    .catch((e) => console.error(e))

    $("#re_sync").text("Connected!");
    $("#re_sync").attr("disabled", true);
    $("#re_sync").attr("hidden", false);
    $("#re_logout").attr("hidden", false);
    $("#re_apikey").hide();
 } else {
    signedOut();
 }
}

function signedOut() {
    $("#re_sync").text("Connect");
    $("#re_sync").attr("disabled", false);
    $("#re_logout").attr("hidden", true);
    $('#re_apikey').val('');
    $("#re_apikey").show();
    $("#re_signin_message").text(`You are not signed into ReTorn. Please enter your api key then click connect.`);
}

function errorMessage(error) {
    console.log(error);
    $("#re_message").text(error.message);
    $("#re_message").attr('hidden', false);
    $("#re_message").parent().attr('hidden', false);
}

})();