var interval = [];
const bars = ["energy", "nerve", "happy", "life"];
const cooldowns = ["booster", "medical", "drug"];

//recursive function for getting updated popup data
function popupDataMessenger() {
    chrome.alarms.get("required_api")
    .then((alarm) => {
      if (alarm != undefined) { //alarm might not exist immedietely, especially if user has just entered an API key, so check if alarm exists, otherwise, wait 1 second and try again
        let scheduledTime = alarm.scheduledTime;
        let now = new Date();
        let millisDif = scheduledTime - now + 1000; //add an extra second in case data hasn't been saved yet
        setTimeout(function(){
          sendMessage({name: "get_local", value: "re_user_data"})
          .then((r) => updatePopup(r.data))
          .then(() => popupDataMessenger())
          .catch((error) => errorMessage(error))
        }, millisDif);
      } else {
        setTimeout(function() {popupDataMessenger()}, 1000);
      }
    })
    .catch((error) => console.log("[ReTorn][popupDataMessenger] Error getting alarm in popup.", error))
}

function updatePopup(data) {
  //if (!data) window.location.href="/pages/popup_start.html";
  $("#re_message").html(`&nbsp;`); //clear error message
  const timestamp = data.timestamp;
  const lastupdate = (Date.now()/1000) - timestamp;

  bars.forEach((bar, i) => {
    let d = data[bar];
    let perc = Math.round((d.current / d.maximum)*100);
    perc = perc > 100 ? 100 : perc;
    $("#"+bar).css('width', perc+'%');
    $("#"+bar+"_text").text(d.current + "/" + d.maximum);

    var fulltime = d.fulltime;
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
    let cash = (data?.money_onhand) ? data.money_onhand.toLocaleString() : 0;
    let points = (data?.points) ? data.points.toLocaleString() : "0";
    let vault = (data?.vault_amount) ? data.vault_amount.toLocaleString() : 0;
    $('#cash').text(`$${cash}`);
    $('#points').text(`${points}`);
    $('#vault').text(`$${vault}`);
  }

  if ($('#status').length && data.status?.description && data.status?.description != "Okay") {

    if (data?.status?.state == "Traveling" && data?.travel?.time_left) {
      clearInterval(interval["traveling"]);
      let timeLeft = data?.travel?.time_left;
      $('#status').html(`<i class="fa-solid fa-plane"></i> Arriving at ${data?.travel?.destination} in ${secondsToDhms(timeLeft-lastupdate)}`);
      interval["traveling"] = setInterval(function() {
          --timeLeft;

          if ((timeLeft) > 0) {
            var timeDisplay = secondsToDhms(timeLeft-lastupdate);
          }
          timeDisplay = timeDisplay == "" ? "0h 0m 0s" : timeDisplay;
          $('#status').html(`<i class="fa-solid fa-plane"></i> Arriving at ${data?.travel?.destination} in ${timeDisplay}`);
      }, 1000);
      
    }
    else {
      $('#status').html(data.status?.description);
    }
  } else {
    $("#status").html(`&nbsp;`);
  }

  if (lastupdate > 20) { //the number should eventually be changed to larger than the interval the user wants to pull the api for (currently interval set to 30 seconds)
    sendMessage({name: "get_local", value: "re_last_error"})
    .then((r) => errorMessage(r.data)).catch((e) => errorMessage(e))
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

$( document ).ready(function() {
    popupDataMessenger();

    sendMessage({name: "get_sync", value: "notifications"})
    .then((r) => {
      if (r.status) {
        const s = r?.data;
  
        if (s?.all_notifications?.enabled) {
          $('#toggle_notifications i').addClass('fa-bell');
          $('#toggle_notifications').attr('data-tooltip','Notifications on');
        } else {
          $('#toggle_notifications i').addClass('fa-bell-slash');
          $('#toggle_notifications').attr('data-tooltip','Notifications off');
        }
      }
    }).catch((error) => errorMessage(error));

    
    //get the user's name, and if it's not available, go back to popup_start
    if ($('#re_user').length != 0) {
        sendMessage({name: "get_local", value: "re_user"})
        .then((r) => {
            if (r.status) {
                $('#re_user').text(`${r.data?.name}`);
            } else {
            chrome.action.setPopup({popup: "pages/popup_start.html"});
            window.location.href="/pages/popup_start.html";
            }
        })
        .catch((error) => errorMessage(error));
    }
    
    //get initial user data to populate the popup
    sendMessage({name: "get_local", value: "re_user_data"})
    .then((r) => {
        if (r.status && r.data) {
            updatePopup(r.data);
        }
    }).catch((error) => errorMessage(error));

  
    $("button#re_logout").click(function() {
        sendMessage({name: "logout"})
        .then((r) => {
            if (r.status) {
                chrome.action.setPopup({popup: "pages/popup_start.html"});
                window.location.href="/pages/popup_start.html";
            } else {
                errorMessage(response);
            }
        }).catch((error) => errorMessage(error));
    });
  
    $("button#toggle_notifications").click(function() {
      let i = $(this).find('i');
      i.toggleClass(['fa-bell', 'fa-bell-slash']);
      let v = i.hasClass('fa-bell');
      if (v) {
        $(this).attr('data-tooltip', "Notifications on");
      } else {
        $(this).attr('data-tooltip', "Notifications off");
      }
      const obj = {["all_notifications"]: {"enabled": v}}


      sendMessage({"name": "merge_sync", "key": "notifications", "object": obj})
      .catch((e) => console.error(e))
    });
});