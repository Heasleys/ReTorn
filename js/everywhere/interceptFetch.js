function interceptFetch(url,q, callback) {
    var originalFetch = window.fetch;
    window.fetch = function() {
        return originalFetch.apply(this, arguments).then(function(data) {
            let dataurl = data.url.toString();
            if (dataurl.includes(url) && dataurl.includes(q)) {
               const clone = data.clone();
               clone.json().then((response) => callback(response, data.url));
            }
            return data;
        });
    };
}

interceptFetch("torn.com","torn.com", (response, url) => {
 console.log("Found a fetch from: " + url, response);

/* Mini Profiles */
 if (url.includes('step=getUserNameContextMenu')) {
   miniProfiles(response);
 }

 /* Christmas Town */
  if (url.includes('christmas_town.php?q=move') || url.includes('christmas_town.php?q=initMap')) {
    christmas_town(response);
  }

});

document.addEventListener('re_fetchInject', function (e)
{
    var url=e.detail;
});



/* Mini Profiles */
function miniProfiles(response) {
    if (response && response.user) {
      let message = "";

        if (response.user.role === "NPC") {
          //Loot Time??
        }

        if (response.user.lastAction && response.user.lastAction.seconds && !isNaN(response.user.lastAction.seconds)) {
          message = "Last Action: ";
          let seconds = response.user.lastAction.seconds;

          let lastaction = secondsToHmsShort(seconds);
          message += lastaction;
          let desc = $('#profile-mini-root').find('.description');
          let subdesc = desc.find('.sub-desc');

          let subdescText = subdesc.text();
          if (subdescText != "") {
            desc.parent('.profile-container').css("min-height", "40px");
            desc.css("height", "40px");
            desc.append(`<span class="sub-desc">`+message+`</span>`);
          } else {
            subdesc.text(message);
          }

          if (response.user.userID === "1468764") {
            $('#profile-mini-root').find('.icons').prepend(`<span class="right" style="font-size: 17px;" title="King of ReTorn">👑</span>`);
          }
        }
    }
}


/* Christmas Town */
var ct_friends;

function christmas_town(response) {
  if (response && response.mapData) {
    if (response.mapData.user) {
      if (response.mapData.user.user_id) {
        let user_id = response.mapData.user.user_id;
        $(`#ctUser${user_id}`).addClass("re_self");
      }
    }
  }

  // Friend Colors
  if (ct_friends && ct_friends.length != 0) {
    for (const [userid, friend] of Object.entries(ct_friends)) {
      if ($(`.users-layer #ctUser${userid}`).length != 0 && friend.color) {
        $(`.users-layer #ctUser${userid}`).addClass('re_friend');
        $(`.users-layer #ctUser${userid}`).find('svg').css('fill', friend.color);
      }
    }
  }
}


document.addEventListener("ct_friends", function(msg) {
  if (msg.detail && msg.detail.re_ct) {
    let re_ct = msg.detail.re_ct;
    if (re_ct.friends) {
      ct_friends = re_ct.friends;
      christmas_town();
    }
  }
});


function secondsToHms(d) {
    d = Number(d);
    var days = Math.floor(d / 86400);
    var h = Math.floor(d % 86400 / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var dayDisplay = days > 0 ? days + (days == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dayDisplay + hDisplay + mDisplay + sDisplay;
}
function secondsToHmsShort(d) {
    d = Number(d);
    var days = Math.floor(d / 86400);
    var h = Math.floor(d % 86400 / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var dayDisplay = days > 0 ? days + (days == 1 ? "d " : "d ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? "h " : "h ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? "m " : "m ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? "s" : "s") : "";

    if (days > 1) {
      return days + " days";
    }

    return dayDisplay + hDisplay + mDisplay + sDisplay;
}
