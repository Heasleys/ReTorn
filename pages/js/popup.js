var interval = [];
var bars = ["energy", "nerve", "happy", "life"];
var cooldowns = ["booster", "medical", "drug"];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.name === "popup_data") {
            console.log(msg.data);
            updatePopup(msg.data);
        }
        return true
    }
);

$( document ).ready(function() {
  chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (response) => {
    if (response.status == true) {
      const settings = response.value.re_settings;

      if (settings.notifications.notifications.enabled) {
        $('button#toggle_notifications i').addClass('fa-bell');
        $('button#toggle_notifications').attr('tooltip','Notifications on');
      } else {
        $('button#toggle_notifications i').addClass('fa-bell-slash');
        $('button#toggle_notifications').attr('tooltip','Notifications off');
      }
    }
  });


    if ($('#re_user').length != 0) {
      chrome.runtime.sendMessage({name: "get_value", value: "re_user"}, (response) => {
        console.log(response);
        if (response.status == true && response.value.re_user.name != undefined) {
          $('#re_user').text(`${response.value.re_user.name}`);
        } else {
          chrome.action.setPopup({popup: "pages/popup_start.html"});
          window.location.href="/pages/popup_start.html";
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
            chrome.action.setPopup({popup: "pages/popup_start.html"});
            window.location.href="/pages/popup_start.html";
          } else {
            errorMessage(response);
          }
        } else {
          errorMessage({status: false, message: "Unknown error."});
        }
      });
    });

    $("button#toggle_notifications").click(function() {
      let icon = $(this).find('i');
      icon.toggleClass(['fa-bell', 'fa-bell-slash']);
      let value = icon.hasClass('fa-bell');
      if (value) {
        $(this).attr('tooltip', "Notifications on");
      } else {
        $(this).attr('tooltip', "Notifications off");
      }

      chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {notifications: {notifications: {enabled: value}}}});
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

  cooldowns.forEach((cooldown, i) => {
    var timestamp = data.timestamp;
    var lastupdate = (Date.now()/1000) - timestamp;

    if (data.cooldowns[cooldown] != "undefined") {
      let seconds = data.cooldowns[cooldown];
      if ((seconds - lastupdate) > 0) {
        var timeDisplay = secondsToDhms(seconds - lastupdate);
      }
      timeDisplay = timeDisplay == "" ? "0h 0m 0s" : timeDisplay;
      $("#"+cooldown).text(timeDisplay);

      clearInterval(interval[cooldown]);
      interval[cooldown] = setInterval(function() {
        --seconds;

        if ((seconds - lastupdate) > 0) {
          var timeDisplay = secondsToDhms(seconds - lastupdate);
        }
        timeDisplay = timeDisplay == "" ? "0h 0m 0s" : timeDisplay;
        $("#"+cooldown).text(timeDisplay);
      }, 1000);
    }
  });

  if ($('div.wealth').length != 0) {
    $('#cash').text("$"+data.money_onhand.toLocaleString());
    $('#points').text(data.points.toLocaleString());
    $('#vault').text("$"+data.vault_amount.toLocaleString());
  }
}

function secondsToDhms(seconds) {
  seconds = Number(seconds);
  //var d = Math.floor(seconds / (3600*24));
  var h = Math.floor(seconds / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);

  //var dDisplay = d > 0 ? d + (d == 1 ? "d " : "d ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? "h " : "h ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? "m " : "m ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? "s" : "s") : "";

  //let display = dDisplay + hDisplay + mDisplay + sDisplay;
  let display = hDisplay + mDisplay + sDisplay;
  return display;
}
