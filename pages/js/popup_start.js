const sendMessage = (msg) => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (data) => {
      resolve(data);
    });
  });
};

function errorMessage(error) {
  if (error) {
    console.log("Error Message", error);
    $("#re_message").text(error.message);
  }
}

async function loginClickEvent() {
  $("#re_message").html(`&nbsp;`); //clear error message
  const key = $("#apikey").val();
  if (key && key.length == 16) {
    sendMessage({name: "set_api", apikey: key})
    .then((r) => {
      if (r.status) {
        window.location.href="/pages/popup.html";
      } else {
        errorMessage({status: false, message: r.message});
      }
    })
    .catch((error) => errorMessage(error));
  } else {
    errorMessage({status: false, message: "Please enter a valid apikey."});
  }
}

$( document ).ready(function() {
  $(`#re_sign_in`).click(loginClickEvent);
  $("#re_options").click(function() {
    sendMessage({name: "open_options"})
  });

  //set darkmode if setting exists for it, otherwise light mode
  sendMessage({name: "get_sync", value: "settings"})
  .then((r) => {
    if (r.status && !r.data?.darkmode) {
      $("html").removeClass('dark');
      $("html").addClass('light');
    }
  })
  .catch((error) => {
    console.log("ReTorn: Error - ", error);
  })

  sendMessage({name: "get_local", value: "re_last_error"})
  .then((r) => errorMessage(r.data)).catch((e) => errorMessage(e))
});
