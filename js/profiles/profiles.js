// @description  Add stat spies and profile info from torn stats to profile
// @author       Heasleys4hemp [1468764]
(function() {
var observer = new MutationObserver(function(mutations) {
  if ($("div.profile-wrapper.medals-wrapper").length == 1 && $('div.re_container').length == 0) {
    loadTS();
    observer.disconnect();
  }
});


//check if captcha exists or if user is logged out, otherwise start observer
if ($('div.captcha').length == 0 && $('div.content-wrapper.logged-out').not('.travelling').length == 0) {
  observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
}


function loadTS() {
  if (features?.pages?.profiles?.profile_stats?.enabled) {
    const uid = parseInt($('a[href*="/playerreport.php?step=add&userID="]').attr("href").replace(/\D/g, ""));
    if (uid) {
      getTornStats(`spy/user/${uid}`)
      .then((data) => {
        profileHeader();
        parseTornStatsData(data)
      })
      .catch((err) => displayError(`Torn Stats Error: ${err}`))
    } else {
      displayError(`There was an issue finding the user id. Refresh your page.`)
    }
  }
}

function profileHeader() {
  insertHeader($("div.profile-wrapper.medals-wrapper"), 'before');
  $('#re_title').text("Torn Stats");
  $('.re_content').html(`
    <div class="re_row" id="re_loader">
      <img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" style="margin-left: 0; left: 0;">
    </div>
    <div class="re_row" style="display: none;" id="re_ts_content">
      <div id="re_compare" style="display: none;"></div>
      <div style="display: none;">
        <div id="re_spy" style="display: none;"></div>
        <div id="re_attacks" style="display: none;"></div>
      </div>
    </div>
    <p id="re_message" style="display: none;"></p>
    `);
}

function parseTornStatsData(data) {
  return new Promise((resolve, reject) => {
    if (data.status) {
      if (data.spy.status) {
        let strCol = "";
        let strSign = "";
        let defCol = "";
        let defSign = "";
        let speCol = "";
        let speSign = "";
        let dexCol = "";
        let dexSign = "";
        let totCol = "";
        let totSign = "";
        if (data.spy.deltaStrength < 0) {
          strCol = " class='red'";
        }
        if (data.spy.deltaStrength > 0) {
          strCol = " class='green'";
          strSign = "+";
        }

        if (data.spy.deltaDefense < 0) {
          defCol = " class='red'";
        }
        if (data.spy.deltaDefense > 0) {
          defCol = " class='green'";
          defSign = "+";
        }

        if (data.spy.deltaSpeed < 0) {
          speCol = " class='red'";
        }
        if (data.spy.deltaSpeed > 0) {
          speCol = " class='green'";
          speSign = "+";
        }

        if (data.spy.deltaDexterity < 0) {
          dexCol = " class='red'";
        }
        if (data.spy.deltaDexterity > 0) {
          dexCol = " class='green'";
          dexSign = "+";
        }

        if (data.spy.deltaTotal < 0) {
          totCol = " class='red'";
        }
        if (data.spy.deltaTotal > 0) {
          totCol = " class='green'";
          totSign = "+";
        }

        let deltaStrength = isNaN(data.spy.strength) ? data.spy.deltaStrength.toLocaleString() : Math.trunc((data.spy.strength + data.spy.deltaStrength)).toLocaleString();
        let deltaDefense = isNaN(data.spy.defense) ? data.spy.deltaDefense.toLocaleString() : Math.trunc((data.spy.defense + data.spy.deltaDefense)).toLocaleString();
        let deltaSpeed = isNaN(data.spy.speed) ? data.spy.deltaSpeed.toLocaleString() : Math.trunc((data.spy.speed + data.spy.deltaSpeed)).toLocaleString();
        let deltaDexterity = isNaN(data.spy.dexterity) ? data.spy.deltaDexterity.toLocaleString() : Math.trunc((data.spy.dexterity + data.spy.deltaDexterity)).toLocaleString();
        let deltaTotal = isNaN(data.spy.total) ? data.spy.deltaTotal.toLocaleString() : Math.trunc((data.spy.total + data.spy.deltaTotal)).toLocaleString();

        let spy_table = `<table><tr><th>Battle Stats</th><th>${data.spy.player_name}</th><th>You</th><th>Difference</th></tr>
        <tr><td>Strength:</td><td>${data.spy.strength.toLocaleString()}</td><td>${deltaStrength}</td><td${strCol}>${Math.trunc(strSign+data.spy.deltaStrength).toLocaleString()}</td></tr>
        <tr><td>Defense:</td><td>${data.spy.defense.toLocaleString()}</td><td>${deltaDefense}</td><td${defCol}>${Math.trunc(defSign+data.spy.deltaDefense).toLocaleString()}</td></tr>
        <tr><td>Speed:</td><td>${data.spy.speed.toLocaleString()}</td><td>${deltaSpeed}</td><td${speCol}>${Math.trunc(speSign+data.spy.deltaSpeed).toLocaleString()}</td></tr>
        <tr><td>Dexterity:</td><td>${data.spy.dexterity.toLocaleString()}</td><td>${deltaDexterity}</td><td${dexCol}>${Math.trunc(dexSign+data.spy.deltaDexterity).toLocaleString()}</td></tr>
        <tr><td>Total:</td><td>${data.spy.total.toLocaleString()}</td><td>${deltaTotal}</td><td${totCol}>${Math.trunc(totSign+data.spy.deltaTotal).toLocaleString()}</td></tr>
        <tr><td>Last Spy: </td><td><b>${data.spy.difference}</b></td><td colspan='2'>Fair Fight Bonus: <b>x${data.spy.fair_fight_bonus.toFixed(2)}</b></td></tr></table>
        `;

        $('#re_spy').html(spy_table);
        $('#re_spy').parent().show();
        $('#re_spy').show();
      } else {
        if (data.spy.message) {
          if (data.spy.message.toLowerCase().includes('error')) {
            $('#re_spy').html(`<span class="re_error"><table><tr><th>${data.spy.message}</th></tr></table></span>`);
            $('#re_spy').show();
            $('#re_spy').parent().show();
          }
        }
      }

      if (data.compare.status) {
        let compare_table = "<table><tr><th>Personal Stats</th><th>Them</th><th>You</th></tr>";

        Object.entries(data.compare.data).forEach(([key, value]) => {
          let color = "";
          let sign = "";
          if (value.difference < 0) {
            color = " class='red'";
          }
          if (value.difference > 0) {
            color = " class='green'";
            sign = "+";
          }
            compare_table += "<tr><td>"+key+"</td><td>"+value.amount.toLocaleString()+"</td><td"+color+">"+sign+value.difference.toLocaleString()+"</td></tr>";
        });
        compare_table += "<tr><td colspan='3'><a href='https://www.tornstats.com/settings/script' target='_blank'>Change your script settings here</a></td></tr>";
        compare_table += "</table>";

        $('#re_compare').html(compare_table);
        $('#re_compare').show();
      } else {
        if (data.compare.message) {
          if (data.compare.message.toLowerCase().includes('error')) {
            $('#re_compare').html(`<span class="re_error"><table><tr><th>${data.compare.message}</th></tr></table></span>`);
            $('#re_compare').show();
          }
        }
      }

      if (data.attacks.status) {
        let attacks_table = "<table><tr><th>Attack History</th></tr>";

        Object.entries(data.attacks.data).forEach(([key, value]) => {
          attacks_table += "<tr><td>"+value+"</td></tr>";
        });

        attacks_table += "</table>";

        $('#re_attacks').html(attacks_table);
        $('#re_attacks').show();
        $('#re_attacks').parent().show();
      } else {
        if (data.attacks.message) {
          if (data.attacks.message.toLowerCase().includes('error')) {
            $('#re_attacks').html(`<span class="re_error"><table><tr><th>${data.attacks.message}</th></tr></table></span>`);
            $('#re_attacks').show();
            $('#re_attacks').parent().show();
          }
        }
      }

    $('#re_ts_content').show();
    } else {
      console.error(data);
      return reject(data.message);
    }
    $('#re_loader').remove();
  });
}



})();