$( document ).ready(function() {
    if ($('#re_user').length != 0) {
      chrome.runtime.sendMessage({name: "get_value", value: "re_user"}, (response) => {
        console.log(response);
        if (response.status == true && response.value.re_user.name != undefined) {
          $('#re_user').text(`${response.value.re_user.name}`);
        }
      });
    }

    chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (response) => {
        if (response.status == true && response.value.re_settings != undefined && response.value.re_settings.darkmode != undefined && response.value.re_settings.darkmode == true) {
          $("html").removeClass('light');
          $("html").addClass('dark');
        } else {
          $("html").removeClass('dark');
          $("html").addClass('light');
        }
    });
});



$("button#re_sign_in").click(function() {
  let key = $("#apikey").val();
  if (key != undefined && key.length == 16) {
    chrome.runtime.sendMessage({name: "set_api", apikey: key}, (response) => {
      console.log(response);
      if (response.status != undefined) {
        if (response.status == true) {
          chrome.action.setPopup({popup: "/pages/popup.html"});
          window.location.href="/pages/popup.html";
        } else {
          errorMessage(response);
        }
      } else {
        errorMessage({status: false, message: "Unknown error."});
      }
    });
  } else {
    errorMessage({status: false, message: "Please enter a valid apikey."});
  }
});

$("button#re_options").click(function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('pages/options.html'));
  }
});

function errorMessage(error) {
  console.log(error);
  $("#re_message").text(error.message);
  $("#re_message").attr('hidden', false);
}
