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
      //Insert container
      if ($(`.re_container[data-feature="${PROFILE_STATS}"]`).length != 0) return;
      const containerObject = {
          "feature": `${PROFILE_STATS}`,
          "insertLocation": "before",
          "elementClasses": "",
          "bar": false
      }
      insertContainer($("div.profile-wrapper.medals-wrapper"), containerObject);
    }
    
    const RE_CONTAINER = $(`.re_container[data-feature="${PROFILE_STATS}"]`);

    RE_CONTAINER.find('.re_content').html(`
      <div class="re_row" id="re_loader">
        <img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" style="margin-left: 0; left: 0;">
      </div>
      <div class="re_row" style="display: none;" id="re_ts_content">
      </div>
      <p id="re_message" style="display: none;"></p>
      `);

    if (RE_CONTAINER.find('#re_ts_refresh').length == 0) {
      //insert button into header menu to refresh Torn Stats profile data manually
      RE_CONTAINER.find('#re_features_settings_view').prepend('<li id="re_ts_refresh"><span class="re_menu_item"><i class="fa-solid fa-arrows-rotate"></i><span class="re_menu_item_text">Refresh profile data</span></span></li>')
      //click event to refresh tornstats data
      RE_CONTAINER.find('#re_ts_refresh').click(function() {
        loadTS(true);
      });
    }
    if ($('#re_difference').length == 0) {
      //insert button into header menu
      RE_CONTAINER.find('#re_features_settings_view').prepend('<li id="re_difference"><span class="re_menu_item"><input type="checkbox" id="re_diff_toggle"><span class="re_menu_item_text">Show relative values</span></span></li>')
      //click event for checkbox
      $('#re_diff_toggle').on("change", function(e) {
        e.stopPropagation();
        let enabled = $('#re_diff_toggle').prop("checked");

        //set toggle settings
        const obj = {"profile": {"relative_values": {"enabled": enabled}}}
            sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
            .then((r) => {
                settings.profile.relative_values.enabled = enabled;
                toggleDiff(enabled);
            })
      });

      //click event for checkbox text to toggle checkbox
      $('#re_difference .re_menu_item_text').click(function(e) {
        e.stopPropagation();
        let checkbox = $('#re_diff_toggle');
        checkbox.prop("checked", !checkbox.prop("checked"));
        checkbox.trigger("change");
      })
    }
  }
  
  function parseTornStatsData(data) {
    return new Promise((resolve, reject) => {
      console.log("data", data)
      if (data.status) {
        if (data.spy.status) {
          //colors and signs
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
            strCol = "red";
          }
          if (data.spy.deltaStrength > 0) {
            strCol = "green";
            strSign = "+";
          }
  
          if (data.spy.deltaDefense < 0) {
            defCol = "red";
          }
          if (data.spy.deltaDefense > 0) {
            defCol = "green";
            defSign = "+";
          }
  
          if (data.spy.deltaSpeed < 0) {
            speCol = "red";
          }
          if (data.spy.deltaSpeed > 0) {
            speCol = "green";
            speSign = "+";
          }
  
          if (data.spy.deltaDexterity < 0) {
            dexCol = "red";
          }
          if (data.spy.deltaDexterity > 0) {
            dexCol = "green";
            dexSign = "+";
          }
  
          if (data.spy.deltaTotal < 0) {
            totCol = "red";
          }
          if (data.spy.deltaTotal > 0) {
            totCol = "green";
            totSign = "+";
          }
  
          //Actual battle stats
          let deltaStrength = isNaN(data.spy.strength) ? data.spy.deltaStrength.toLocaleString() : Math.trunc((data.spy.strength + data.spy.deltaStrength)).toLocaleString();
          let deltaDefense = isNaN(data.spy.defense) ? data.spy.deltaDefense.toLocaleString() : Math.trunc((data.spy.defense + data.spy.deltaDefense)).toLocaleString();
          let deltaSpeed = isNaN(data.spy.speed) ? data.spy.deltaSpeed.toLocaleString() : Math.trunc((data.spy.speed + data.spy.deltaSpeed)).toLocaleString();
          let deltaDexterity = isNaN(data.spy.dexterity) ? data.spy.deltaDexterity.toLocaleString() : Math.trunc((data.spy.dexterity + data.spy.deltaDexterity)).toLocaleString();
          let deltaTotal = isNaN(data.spy.total) ? data.spy.deltaTotal.toLocaleString() : Math.trunc((data.spy.total + data.spy.deltaTotal)).toLocaleString();

          //Difference between spy and user battle stats
          let strDiff = `${strSign}${Math.trunc(strSign+data.spy.deltaStrength).toLocaleString()}`;
          let defDiff = `${defSign}${Math.trunc(defSign+data.spy.deltaDefense).toLocaleString()}`;
          let speDiff = `${speSign}${Math.trunc(speSign+data.spy.deltaSpeed).toLocaleString()}`;
          let dexDiff = `${dexSign}${Math.trunc(dexSign+data.spy.deltaDexterity).toLocaleString()}`;
          let totDiff = `${totSign}${Math.trunc(totSign+data.spy.deltaTotal).toLocaleString()}`;
  
  
          let spyUL = `<ul class="re_infotable">`;
          spyUL += `<li style="order: -1;"><div class="re_table-label"><span class="bold">Battle Stats</span></div><div class="re_table_value them"><span class="bold">Them</span></div><div class="re_table_value you"><span class="bold">You</span></div></li>`;
  
          //Strength Spy + User
          spyUL += `<li class="re_stat"><div class="re_table-label"><span class="bold">Strength:</span></div>`;
          spyUL += `<div class="re_table_value them"><span>${data.spy.strength.toLocaleString()}</span></div>`;
          spyUL += `<div class="re_table_value you"><span class="${strCol}" data-color="${strCol}" data-diff="${strDiff}" data-stat="${deltaStrength}"></span></div>`;
          spyUL += `</li>`;

          //Defense Spy + User
          spyUL += `<li class="re_stat"><div class="re_table-label"><span class="bold">Defense:</span></div>`;
          spyUL += `<div class="re_table_value them"><span>${data.spy.defense.toLocaleString()}</span></div>`;
          spyUL += `<div class="re_table_value you"><span class="${defCol}"  data-color="${defCol}" data-diff="${defDiff}" data-stat="${deltaDefense}"></span></div>`;
          spyUL += `</li>`;
  
          //Speed Spy + User
          spyUL += `<li class="re_stat"><div class="re_table-label"><span class="bold">Speed:</span></div>`;
          spyUL += `<div class="re_table_value them"><span>${data.spy.speed.toLocaleString()}</span></div>`;
          spyUL += `<div class="re_table_value you"><span class="${speCol}"  data-color="${speCol}" data-diff="${speDiff}" data-stat="${deltaSpeed}"></span></div>`;
          spyUL += `</li>`;

          //Dexterity Spy + User
          spyUL += `<li class="re_stat"><div class="re_table-label"><span class="bold">Dexterity:</span></div>`;
          spyUL += `<div class="re_table_value them"><span>${data.spy.dexterity.toLocaleString()}</span></div>`;
          spyUL += `<div class="re_table_value you"><span class="${dexCol}" data-color="${dexCol}" data-diff="${dexDiff}" data-stat="${deltaDexterity}"></span></div>`;
          spyUL += `</li>`;

          //Total Spy + User
          spyUL += `<li class="re_stat"><div class="re_table-label"><span class="bold">Total:</span></div>`;
          spyUL += `<div class="re_table_value them"><span>${data.spy.total.toLocaleString()}</span></div>`;
          spyUL += `<div class="re_table_value you"><span class="${totCol}" data-color="${totCol}" data-diff="${totDiff}" data-stat="${deltaTotal}"></span></div>`;
          spyUL += `</li>`;

  
          spyUL += `<li style="order: 999;"><div class="re_table-label"><span class="bold">Last Spy:</span></div><div class="re_table_value them"><span>${data.spy.difference}</span></div><div class="re_table_value them"><span>Fair Fight Bonus: </span><span class="bold">x${data.spy.fair_fight_bonus.toFixed(2)}</span></div></div></li>`;
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
            attackUL += `<li><div class="re_table_value center"><span>${value}</span></div></li>`
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
          compareUL += `<li style="order: -1;"><div class="re_table-label"><span class="bold">Personal Stats</span></div><div class="re_table_value them"><span class="bold">Them</span></div><div class="re_table_value you"><span class="bold">You</span></div></li>`;
  
  
          Object.entries(data.compare.data).forEach(([key, value]) => {
            let color = "";
            let sign = "";
            if (value.difference < 0) {
              color = "red";
            }
            if (value.difference > 0) {
              color = "green";
              sign = "+";
            }

            let difference = `${sign}${value.difference.toLocaleString()}`;
            let absolute = Math.trunc((value.amount + value.difference)).toLocaleString();

            compareUL += `<li class="re_stat" style="order: ${value.order};">
            <div class="re_table-label"><span class="bold">${key}</span></div>
            <div class="re_table_value them"><span>${value.amount.toLocaleString()}</span></div>
            <div class="re_table_value you"><span class="${color}" data-color="${color}" data-diff="${difference}" data-stat="${absolute}"></span></div>
            </li>`;
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
  
        //initial toggleDiff
        if (settings?.profile?.relative_values?.enabled) {
          $('#re_diff_toggle').prop("checked", true);
          toggleDiff(true);
        } else {
          toggleDiff();
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
  
  function beginRearrange() {

  }

  function toggleDiff(diff = false) {
    //default to difference being the hover title and the actual stat being the text
    if (diff) {
      var strTitle = 'data-stat';
      var strText = 'data-diff';
    } else {
      var strTitle = 'data-diff';
      var strText = 'data-stat';
    }

    $('.re_stat .you > span').each(function() {
      let title = $(this).attr(strTitle);
      let text = $(this).attr(strText);

      $(this).text(text);
      $(this).attr('title', `<div class="${$(this).attr('data-color')}" style="text-align: center;">${title}</div>`);
    })

  }
  
  })();