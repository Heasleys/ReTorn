// @description  Add stat spies and profile info from torn stats to profile
// @author       Heasleys4hemp [1468764]
(function() {
  var profileobserver = new MutationObserver(function(mutations) {
    //check if captcha exists or if user is logged out
    if ($('div.captcha').length == 0 && $('div.content-wrapper.logged-out').not('.travelling').length == 0) {
      if ($("div.profile-wrapper.medals-wrapper").length == 1 && $('div.re_container').length == 0) {
        loadTS();
        profileobserver.disconnect();
      }
    }
  });
  
  
  
  profileobserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
  
  
  function loadTS(forced = false) {
    if (features?.pages?.profiles?.profile_stats?.enabled) {
      const uid = parseInt($('a[href*="/playerreport.php?step=add&userID="]').attr("href").replace(/\D/g, ""));
      if (uid) {
        profileHeader();
        getTornStats(`spy/user/${uid}`, 8, forced)
        .then((data) => {
          parseTornStatsData(data)
        })
        .catch((err) => displayError(`Torn Stats Error: ${err}`))
      } else {
        displayError(`There was an issue finding the user id. Refresh your page.`)
      }
    }
  }
  
  function profileHeader() {
    if ($('div.re_container').length == 0) {
      insertHeader($("div.profile-wrapper.medals-wrapper"), 'before', 'profile_stats');
    }
    $('.re_content').html(`
      <div class="re_row" id="re_loader">
        <img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" style="margin-left: 0; left: 0;">
      </div>
      <div class="re_row" style="display: none;" id="re_ts_content">
      </div>
      <p id="re_message" style="display: none;"></p>
      `);

    if ($('#re_ts_refresh').length == 0) {
      //insert button into header menu to refresh Torn Stats profile data manually
      $('#re_features_settings_view').prepend('<li id="re_ts_refresh"><span class="re_menu_item"><i class="fa-solid fa-arrows-rotate"></i><span class="re_menu_item_text">Refresh profile data</span></span></li>')
      //click event to refresh tornstats data
      $('#re_ts_refresh').click(function() {
        loadTS(true);
      });
    }
  }
  
  function parseTornStatsData(data) {
    return new Promise((resolve, reject) => {
      console.log("data", data)
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
  
  
          let spyUL = `<ul class="re_infotable">`;
          spyUL += `<li style="order: -1;"><div class="re_table-label"><span class="bold">Battle Stats</span></div><div class="re_table-value them"><span class="bold">Them</span></div><div class="re_table-value you"><span class="bold">You</span></div></li>`;
  
          spyUL += ``;
          spyUL += `<li><div class="re_table-label"><span class="bold">Strength:</span></div><div class="re_table-value them"><span>${data.spy.strength.toLocaleString()}</span></div><div class="re_table-value you"><span${strCol} title="<div${strCol} style='text-align: center;'>${strSign}${Math.trunc(strSign+data.spy.deltaStrength).toLocaleString()}</div>">${deltaStrength}</span></div></li>`;
  
          spyUL += `<li><div class="re_table-label"><span class="bold">Defense:</span></div><div class="re_table-value them"><span>${data.spy.defense.toLocaleString()}</span></div><div class="re_table-value you"><span${defCol} title="<div${defCol} style='text-align: center;'>${defSign}${Math.trunc(defSign+data.spy.deltaDefense).toLocaleString()}</div>">${deltaDefense}</span></div></li>`
  
          spyUL += `<li><div class="re_table-label"><span class="bold">Speed:</span></div><div class="re_table-value them"><span>${data.spy.speed.toLocaleString()}</span></div><div class="re_table-value you"><span${speCol} title="<div${speCol} style='text-align: center;'>${speSign}${Math.trunc(speSign+data.spy.deltaSpeed).toLocaleString()}</div>">${deltaSpeed}</span></div></li>`

          spyUL += `<li><div class="re_table-label"><span class="bold">Dexterity:</span></div><div class="re_table-value them"><span>${data.spy.dexterity.toLocaleString()}</span></div><div class="re_table-value you"><span${dexCol} title="<div${dexCol} style='text-align: center;'>${dexSign}${Math.trunc(dexSign+data.spy.deltaDexterity).toLocaleString()}</div>">${deltaDexterity}</span></div></li>`

          spyUL += `<li><div class="re_table-label"><span class="bold">Total:</span></div><div class="re_table-value them"><span>${data.spy.total.toLocaleString()}</span></div><div class="re_table-value you"><span${totCol} title="<div${totCol} style='text-align: center;'>${totSign}${Math.trunc(totSign+data.spy.deltaTotal).toLocaleString()}</div>">${deltaTotal}</span></div></li>`

  
          spyUL += `<li style="order: 999;"><div class="re_table-label"><span class="bold">Last Spy:</span></div><div class="re_table-value them"><span>${data.spy.difference}</span></div><div class="re_table-value them"><span>Fair Fight Bonus: </span><span class="bold">x${data.spy.fair_fight_bonus.toFixed(2)}</span></div></div></li>`;
          spyUL += "</ul>";

          if ($("#re_spy_attack").length == 0) {
            $('#re_ts_content').append('<div id="re_spy_attack" style="display: none;"></div>')
          }
          $('#re_spy_attack').append(`<div id="re_spy" style="display: none;"></div>`)


          $('#re_spy').html(spyUL);
          $('#re_spy').parent().show();
          $('#re_spy').show();
        } else {
          if (data.spy.message) {
            if (data.spy.message.toLowerCase().includes('error')) {
              if ($("#re_spy_attack").length == 0) {
                $('#re_ts_content').append('<div id="re_spy_attack" style="display: none;"></div>')
              }
              $('#re_spy_attack').append(`<div id="re_spy" style="display: none;"></div>`);

              $('#re_spy').html(`<ul class="re_infotable"><li style="order: 999;"><div class="re_table-label"><span>${data.spy.message}</span></div></li>`);
              $('#re_spy').show();
              $('#re_spy').parent().show();
            }
          }
        }
  
        if (data.attacks.status) {

          let attackUL = `<ul class="re_infotable">`;
          attackUL += `<li style="order: -1;"><div class="re_table-label center"><span class="bold">Attack History</span></div></li>`;
          
          Object.entries(data.attacks.data).forEach(([key, value]) => {
            attackUL += `<li><div class="re_table-value center"><span>${value}</span></div></li>`
          });
          attackUL += `</ul>`;

          if ($("#re_spy_attack").length == 0) {
            $('#re_ts_content').append('<div id="re_spy_attack" style="display: none;"></div>')
          }
  
          $('#re_spy_attack').append(`<div id="re_attacks" style="display: none;"></div>`)
          $('#re_attacks').html(attackUL);
          $('#re_attacks').show();
          $('#re_attacks').parent().show();
        }
  
  
        if (data.compare.status && data.compare.data) {
          let compareUL = `<ul class="re_infotable">`;
          compareUL += `<li style="order: -1;"><div class="re_table-label"><span class="bold">Personal Stats</span></div><div class="re_table-value them"><span class="bold">Them</span></div><div class="re_table-value you"><span class="bold">You</span></div></li>`;
  
  
          Object.entries(data.compare.data).forEach(([key, value]) => {
            console.log("KEY", key, "Value", value)
            let color = "";
            let sign = "";
            if (value.difference < 0) {
              color = " class='red'";
            }
            if (value.difference > 0) {
              color = " class='green'";
              sign = "+";
            }
            compareUL += `<li style="order: ${value.order};"><div class="re_table-label"><span class="bold">${key}</span></div><div class="re_table-value them"><span>${value.amount.toLocaleString()}</span></div><div class="re_table-value you"><span${color}>${sign}${value.difference.toLocaleString()}</span></div></li>`
          });
          compareUL += `<li style="order: 999;"><div style="width: 100%; text-align: center;"><span><a href='https://www.tornstats.com/settings/script' target='_blank'>Change your script settings here</a></span></div></li>`;
          compareUL += "</ul>";

          $('#re_ts_content').prepend(`<div id="re_compare" style="display: none;"></div>`)
          $('#re_compare').html(compareUL);
          $('#re_compare').show();
        } else {
          if (data.compare.message) {
            if (data.compare.message.toLowerCase().includes('error')) {
              $('#re_ts_content').prepend(`<div id="re_compare" style="display: none;"></div>`)
              $('#re_attacks').html(`<ul class="re_infotable"><li style="order: 999;"><div class="re_table-label"><span>${data.compare.message}</span></div></li>`);
              $('#re_compare').show();
            }
          }
        }
  
      $('#re_ts_content').show();
      } else {
        if (data?.message.includes('re_torn_stats_apikey')) {
          displayError(`You do not currently have your <b><a href="https://www.tornstats.com/"  target="_blank">Torn Stats</a></b> account linked. <a id='re_options'>Click here</a> to view the ReTorn options.`)
        } else {
          displayError(`Torn Stats Error - ${data?.message}`)
        }
      }
      $('#re_loader').remove();
      const e = new CustomEvent("initializeTooltip");
      document.dispatchEvent(e);
    });
  }
  
  
  
  })();