// @version      1.0.0
// @description  Add stat spies and profile info from torn stats to profile
// @author       Heasleys4hemp [1468764]

var observer = new MutationObserver(function(mutations) {
  if ($("div.profile-wrapper.medals-wrapper").length == 1 && $('div.re_container').length == 0) {
    loadTS();
    observer.disconnect();
  }
});

observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});


function loadTS() {
  chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (res) => {
    if (res.status != undefined) {
      if (res.value.re_settings.tornstats != undefined && res.value.re_settings.tornstats == true) {
        chrome.runtime.sendMessage({name: "get_value", value: "re_api_key"}, (response) => {
          if (response.status != undefined) {
            if (response.status == true) {
              tornstatsSync(response.value.re_api_key);
            }
          }
        });
      }
    }
  });
}

function tornstatsSync(apikey) {
  var uid = parseInt($('a[href*="/playerreport.php?step=add&userID="]').attr("href").replace(/\D/g, ""));
  if (uid) {
    chrome.runtime.sendMessage({name: "pull_tornstats", selection: "spy/"+uid}, (data) => {
      if (data) {
        console.log(data);
        if (data.status == true) {
          profileHeader();
          if (data.spy.status == true) {
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

            let spy_table = "<table><tr><th>Battle Stats</th><th>"+data.spy.player_name+"</th><th>You</th><th>Difference</th></tr>";
            spy_table += "<tr><td>Strength:</td><td>"+data.spy.strength.toLocaleString()+"</td><td>"+Math.trunc((data.spy.strength + data.spy.deltaStrength)).toLocaleString()+"</td><td"+strCol+">"+Math.trunc(strSign+data.spy.deltaStrength).toLocaleString()+"</td></tr>";
            spy_table += "<tr><td>Defense:</td><td>"+data.spy.defense.toLocaleString()+"</td><td>"+Math.trunc((data.spy.defense + data.spy.deltaDefense)).toLocaleString()+"</td><td"+defCol+">"+Math.trunc(defSign+data.spy.deltaDefense).toLocaleString()+"</td></tr>";
            spy_table += "<tr><td>Speed:</td><td>"+data.spy.speed.toLocaleString()+"</td><td>"+Math.trunc((data.spy.speed + data.spy.deltaSpeed)).toLocaleString()+"</td><td"+speCol+">"+Math.trunc(speSign+data.spy.deltaSpeed).toLocaleString()+"</td></tr>";
            spy_table += "<tr><td>Dexterity:</td><td>"+data.spy.dexterity.toLocaleString()+"</td><td>"+Math.trunc((data.spy.dexterity + data.spy.deltaDexterity)).toLocaleString()+"</td><td"+dexCol+">"+Math.trunc(dexSign+data.spy.deltaDexterity).toLocaleString()+"</td></tr>";
            spy_table += "<tr><td>Total:</td><td>"+data.spy.total.toLocaleString()+"</td><td>"+Math.trunc((data.spy.total + data.spy.deltaTotal)).toLocaleString()+"</td><td"+totCol+">"+Math.trunc(totSign+data.spy.deltaTotal).toLocaleString()+"</td></tr>";
            spy_table += "<tr><td>Last Spy: </td><td><b>"+data.spy.difference+"</b></td><td colspan='2'>Fair Fight Bonus: <b>x"+data.spy.fair_fight_bonus.toFixed(2)+"</b></td></tr>";

            spy_table += "</table>";

            $('#re_spy').html(spy_table);
            $('#re_spy').parent().show();
            $('#re_spy').show();
          }

          if (data.compare.status == true) {
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
          }

          if (data.attacks.status == true) {
            let attacks_table = "<table><tr><th>Attack History</th></tr>";

            Object.entries(data.attacks.data).forEach(([key, value]) => {
              attacks_table += "<tr><td>"+value+"</td></tr>";
            });

            attacks_table += "</table>";

            $('#re_attacks').html(attacks_table);
            $('#re_attacks').show();
            $('#re_attacks').parent().show();
          }
        }
      }
    });
  }
}

function profileHeader() {
  insertHeader($("div.profile-wrapper.medals-wrapper"), 'before');
  $('#re_title').text("Torn Stats");
  $('.re_content').html(`
    <div class="re_row">
      <div id="re_compare" style="display: none;"></div>
      <div style="display: none;">
        <div id="re_spy" style="display: none;"></div>
        <div id="re_attacks" style="display: none;"></div>
      </div>
    </div>
    `);
}
