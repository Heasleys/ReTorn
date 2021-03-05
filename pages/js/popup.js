var interval = [];
var bars = ["energy", "nerve", "happy", "life"];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.name === "popup_data") {
            console.log(msg.data);
            updatePopup(msg.data);
        }
    }
);

$( document ).ready(function() {
    if ($('#re_user').length != 0) {
      chrome.runtime.sendMessage({name: "get_value", value: "re_user"}, (response) => {
        console.log(response);
        if (response.status == true && response.value.re_user.name != undefined) {
          $('#re_user').text(`${response.value.re_user.name}`);
        }
      });
    }

    chrome.runtime.sendMessage({name: "get_value", value: "re_user_data", type: "local"}, (response) => {
      console.log(response);
      if (response.status == true && response.value.re_user_data != undefined) {
        var data = response.value.re_user_data;
        updatePopup(data);
      }
    });

    $("button#re_logout").click(function() {
      chrome.runtime.sendMessage({name: "logout"}, (response) => {
        console.log(response);
        if (response.status != undefined) {
          if (response.status == true) {
            chrome.action.setPopup({popup: "pages/popup.html"});
            window.location.href="/pages/popup.html";
          } else {
            errorMessage(response);
          }
        } else {
          errorMessage({status: false, message: "Unknown error."});
        }
      });
    });
});

function updatePopup(data) {
  var timestamp = data.timestamp;
  bars.forEach((bar, i) => {
    let d = data[bar];
    let perc = Math.round((d.current / d.maximum)*100);
    perc = perc > 100 ? 100 : perc;
    $("#"+bar).css('width', perc+'%');
    $("#"+bar+"_text").text(d.current + "/" + d.maximum);

    var incr = d.increment;
    var fulltime = d.fulltime;
    var ticktime = d.ticktime;
    var lastupdate = (Date.now()/1000) - timestamp;
    var lastupdate2 = lastupdate;
    var lastupdateDisplay = secondsToDhms(lastupdate);
    var timeDisplay = secondsToDhms(fulltime - lastupdate);
    timeDisplay = timeDisplay == "" ? "Full" : timeDisplay;
    lastupdateDisplay = lastupdateDisplay == "" ? "0s" : lastupdateDisplay;
    $("#"+bar+"_countdown").html(timeDisplay);
    $("#last_updated").html(lastupdateDisplay);

    clearInterval(interval[bar]);
    interval[bar] = setInterval(function() {
      --fulltime;
      ++lastupdate2;
      lastupdateDisplay = secondsToDhms(lastupdate2);
      lastupdateDisplay = lastupdateDisplay == "" ? "0s" : lastupdateDisplay;
      timeDisplay = secondsToDhms(fulltime - lastupdate);
      timeDisplay = timeDisplay == "" ? "Full" : timeDisplay;
      $("#"+bar+"_countdown").html(timeDisplay);
      $("#last_updated").html(lastupdateDisplay);
    }, 1000);

  });
}

function secondsToDhms(seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600*24));
  var h = Math.floor(seconds % (3600*24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);

  var dDisplay = d > 0 ? d + (d == 1 ? "d " : "d ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? "h " : "h ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? "m " : "m ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? "s" : "s") : "";

  let display = dDisplay + hDisplay + mDisplay + sDisplay;
  return display;
}
