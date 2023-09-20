// @description  Add stat spies and profile info from torn stats to profile
// @author       Heasleys4hemp [1468764]
(function() {
  var uid;
  var TS_DATA;
  var profileobserver = new MutationObserver(function(mutations) {
    //check if captcha exists or if user is logged out
    if ($('div.captcha').length == 0 && $('div.content-wrapper.logged-out').not('.travelling').length == 0) {
      if ($("div.profile-wrapper.medals-wrapper").length == 1 && $('div.re_container').length == 0) {
        loadTS();
        insert_age_text();
        profileobserver.disconnect();
      }
    }
  });
  
  
  
  profileobserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
  
  
  function loadTS(forced = false) {
    if (features?.pages?.profiles?.profile_stats?.enabled) {
      uid = parseInt($('a[href*="/playerreport.php?step=add&userID="]').attr("href").replace(/\D/g, ""));
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

    if ($('#re_ts_modify').length == 0) {
      //insert button into header menu
      RE_CONTAINER.find('#re_features_settings_view').prepend('<li id="re_ts_modify"><span class="re_menu_item"><i class="fa-regular fa-pen-to-square"></i><span class="re_menu_item_text">Modify profile stats</span></span></li>')
      //click event
      $('#re_ts_modify').click(function() {
        if (!$('#re_compare .re_modify_active').length) {
          begin_modify();
        } else {
          end_modify();
        }
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
      TS_DATA = data;
      if (data.status) {
        if (data?.spy?.status) {
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
          spyUL += `<li style="order: -1;"><div class="re_table_label"><span class="bold">Battle Stats</span></div><div class="re_table_value them"><span class="bold">Them</span></div><div class="re_table_value you"><span class="bold">You</span></div></li>`;
  
          //Strength Spy + User
          spyUL += `<li class="re_stat"><div class="re_table_label"><span class="bold">Strength:</span></div>`;
          spyUL += `<div class="re_table_value them"><span>${data.spy.strength.toLocaleString()}</span></div>`;
          spyUL += `<div class="re_table_value you"><span class="${strCol}" data-color="${strCol}" data-diff="${strDiff}" data-stat="${deltaStrength}"></span></div>`;
          spyUL += `</li>`;

          //Defense Spy + User
          spyUL += `<li class="re_stat"><div class="re_table_label"><span class="bold">Defense:</span></div>`;
          spyUL += `<div class="re_table_value them"><span>${data.spy.defense.toLocaleString()}</span></div>`;
          spyUL += `<div class="re_table_value you"><span class="${defCol}"  data-color="${defCol}" data-diff="${defDiff}" data-stat="${deltaDefense}"></span></div>`;
          spyUL += `</li>`;
  
          //Speed Spy + User
          spyUL += `<li class="re_stat"><div class="re_table_label"><span class="bold">Speed:</span></div>`;
          spyUL += `<div class="re_table_value them"><span>${data.spy.speed.toLocaleString()}</span></div>`;
          spyUL += `<div class="re_table_value you"><span class="${speCol}"  data-color="${speCol}" data-diff="${speDiff}" data-stat="${deltaSpeed}"></span></div>`;
          spyUL += `</li>`;

          //Dexterity Spy + User
          spyUL += `<li class="re_stat"><div class="re_table_label"><span class="bold">Dexterity:</span></div>`;
          spyUL += `<div class="re_table_value them"><span>${data.spy.dexterity.toLocaleString()}</span></div>`;
          spyUL += `<div class="re_table_value you"><span class="${dexCol}" data-color="${dexCol}" data-diff="${dexDiff}" data-stat="${deltaDexterity}"></span></div>`;
          spyUL += `</li>`;

          //Total Spy + User
          spyUL += `<li class="re_stat"><div class="re_table_label"><span class="bold">Total:</span></div>`;
          spyUL += `<div class="re_table_value them"><span>${data.spy.total.toLocaleString()}</span></div>`;
          spyUL += `<div class="re_table_value you"><span class="${totCol}" data-color="${totCol}" data-diff="${totDiff}" data-stat="${deltaTotal}"></span></div>`;
          spyUL += `</li>`;

  
          spyUL += `<li style="order: 999;"><div class="re_table_label"><span class="bold">Last Spy:</span></div><div class="re_table_value them"><span>${data.spy.difference}</span></div><div class="re_table_value them"><span>Fair Fight Bonus: </span><span class="bold">x${data.spy.fair_fight_bonus.toFixed(2)}</span></div></div></li>`;
          spyUL += "</ul>";

          if ($("#re_spy_attack").length == 0) {
            $('#re_ts_content').append('<div id="re_spy_attack" style="display: none;"></div>')
          }
          $('#re_spy_attack').append(`<div id="re_spy" style="display: none;"></div>`)


          $('#re_spy').html(spyUL);
          $('#re_spy').parent().show();
          $('#re_spy').show();
        } else {
          if (data?.spy?.message) {
            if (data.spy.message.toLowerCase().includes('error')) {
              if ($("#re_spy_attack").length == 0) {
                $('#re_ts_content').append('<div id="re_spy_attack" style="display: none;"></div>')
              }
              $('#re_spy_attack').append(`<div id="re_spy" style="display: none;"></div>`);

              $('#re_spy').html(`<ul class="re_infotable"><li style="order: 999;"><div class="re_table_label"><span>${data.spy.message}</span></div></li>`);
              $('#re_spy').show();
              $('#re_spy').parent().show();
            }
          }
        }
  
        if (data?.attacks?.status) {

          let attackUL = `<ul class="re_infotable">`;
          attackUL += `<li style="order: -1;"><div class="re_table_label center"><span class="bold">Attack History</span></div></li>`;
          
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
  
  
        if (data?.compare?.status && data?.compare?.data) {
          let compareUL = `<ul class="re_infotable">`;
          compareUL += `<li class="re_table_title" style="order: -1;"><div class="re_table_label"><span class="bold">Personal Stats</span></div><div class="re_table_value them"><span class="bold">Them</span></div><div class="re_table_value you"><span class="bold">You</span></div></li>`;
  
          sorted = [];

          Object
          .keys(data.compare.data).sort(function(a, b){
              return data.compare.data[a].order - data.compare.data[b].order;
          })
          .forEach(function(key) {
              sorted.push({[key]: data.compare.data[key]});
          });
        
  
          sorted.forEach((e) => {
            const key = Object.keys(e)[0];
            const value = Object.values(e)[0];

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
            <div class="re_table_label"><span class="bold">${key}</span></div>
            <div class="re_table_value them"><span>${value.amount.toLocaleString()}</span></div>
            <div class="re_table_value you"><span class="${color}" data-color="${color}" data-diff="${difference}" data-stat="${absolute}"></span></div>
            </li>`;
          });
          compareUL += `<li style="order: 999;"><div style="width: 100%; text-align: center;"><span><a href='https://www.tornstats.com/settings/script' target='_blank'>Change your script settings here</a></span></div></li>`;
          compareUL += "</ul>";

          if ($('#re_compare').length) $('#re_compare').remove(); //refresh

          $('#re_ts_content').prepend(`<div id="re_compare" style="display: none;"></div>`)
          $('#re_compare').html(compareUL);
          $('#re_compare').show();
        } else {
          if (data.compare.message) {
            if (data.compare.message.toLowerCase().includes('error')) {
              $('#re_ts_content').prepend(`<div id="re_compare" style="display: none;"></div>`)
              $('#re_attacks').html(`<ul class="re_infotable"><li style="order: 999;"><div class="re_table_label"><span>${data.compare.message}</span></div></li>`);
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
  
  function begin_modify() {
    //Add modify features
    const grip = `<div class="re_grip"><i class="fa-solid fa-grip-lines"></i></div>`;
    const del = `<div class="re_delete"><i class="fa-solid fa-x re_red"></i></div>`;
    const compare = $('#re_compare');
    const parent = compare.find('.re_infotable');
    parent.addClass('re_modify_active');

    parent.find('.re_table_title').prepend(`<div class="re_grip"></div>`);
    parent.find('.re_table_title').append(`<div class="re_delete"></div>`);

    const li = parent.find('li.re_stat');

    li.each(function() {
      $(this).prepend(grip);
      $(this).append(del);
    });

    parent.find('.re_delete').click(function() {
      $(this).closest('li.re_stat').hide();
    });

    parent.sortable({axis: "y", items: "> li.re_stat", handle: ".re_grip"});

    var stat_list = [];
    parent.find('.re_stat:visible').each(function(i) {
      const t = $(this).find('.re_table_label').text();
      stat_list.push(t);
    });

    //fill datalist for Weapon Bonuses
    var new_stat_input = `<input type="text" id="new_stat_input" list="new_stat_datalist" placeholder="Add personal stat">
    <datalist id="new_stat_datalist">`;
    $.each(PERSONALSTATS, function(n,e) {
      if (!stat_list.includes(e.name)) {
        new_stat_input += '<option data-name="'+e.name+'">'+e.name+'</option>';
      }
    });
    new_stat_input += `</datalist>`;

    const finish_buttons = `
    <div id="re_modify_form">
      <div class="re_button_wrap">${new_stat_input}<button class="re_button" id="new_stat_button" style="display: none;">Add</button></div>
      <div class="re_button_wrap"><button class="re_button" id="re_save_modify">Save</button><button class="re_button" id="re_cancel_modify">Cancel</button></div>
    </div>
    `;

    compare.append(finish_buttons);

    $('#re_save_modify').click(save_modify);
    $('#re_cancel_modify').click(end_modify);

    $('#new_stat_input').on('input', function() {
      const val = $('#new_stat_input').val();
      const opts = $('#new_stat_datalist > option');
  
      for (var i = 0; i < opts.length; i++) {
        if ($(opts[i]).attr('data-name') === val) {
          $('#new_stat_button').show();
          break;
        }
      }
    });

    $('#new_stat_button').click(function() {
      const val = $('#new_stat_input').val();
      if (!val) return;
      $.each(PERSONALSTATS, function(n,e) {
        if (e.name != val) {
          return;
        }
        if (stat_list.includes(val)) {
          return;
        }

        let order = $('.re_stat:visible').length + 1;

        const new_stat = `
        <li class="re_stat re_new" data-name="${val}" style="order: ${order};"><div class="re_grip ui-sortable-handle"><i class="fa-solid fa-grip-lines"></i></div>
            <div class="re_table_label"><span class="bold">${val}</span></div>
            <div class="re_table_value them"><span></span></div>
            <div class="re_table_value you"><span></span></div>
            <div class="re_delete"><i class="fa-solid fa-x re_red"></i></div>
        </li>
        `;

        $('#re_compare .re_stat').last().after(new_stat);
        $("#re_compare .re_stat.re_new").find('.re_delete').click(function() {
          $(this).closest('li.re_stat').hide();
        });
        stat_list.push(val);
        $(`#new_stat_datalist > option[data-name="${val}"]`).remove();
        $('#new_stat_input').val("");
        $('#new_stat_button').hide();
      });
    });

  }

  async function save_modify() {
    const parent = $('#re_compare .re_infotable.re_modify_active');
    var key_string = "";

    //modify stats order
    parent.find('.re_stat:visible').each(function(i) {
      const order = i + 1;
      const t = $(this).find('.re_table_label').text();
      $(this).css("order", order);
      if (!TS_DATA.compare.data[t]) {
        TS_DATA.compare.data[t] = {order: order}
      } else {
        TS_DATA.compare.data[t].order = order;
      }
      const key = PERSONALSTATS.filter((p) => t == p.name).pop().key;
      key_string += key + ","
    });
    key_string = key_string.replace(/,\s*$/, ""); //remove comma and whitespace

    // remove deleted stats from TS_DATA
    parent.find('.re_stat:not(:visible)').each(function() {
      const t = $(this).find('.re_table_label').text();
      delete TS_DATA.compare.data[t];
      sendMessage({name: "delete_keys_recursively", keys: ["torn_stats", t], location: "local", require: "spy_"})
      .catch((e) => {displayError(e)})
    });

    const new_ts_data = {[`spy_user_${uid}`]: TS_DATA}

    sendMessage({name: "get_torn_stats", selection: `settings&personalstats=${key_string}`})// Dont use getTornStats for this because this records new info, not pulls info
    .then((data) => {
      if (!data.status) {
        throw data.message;
      }
    })
    .then(() => sendMessage({"name": "merge_local", "key": "torn_stats", "object": new_ts_data}))
    .then(() => sendMessage({name: "modify_keys_recursively", keys: ["torn_stats", "cache_until"], new_value: "1", location: "local", require: "spy_"}))       //since we have changed the order of personalstats, we need to fix personal stats of all user profiles. So we remove the cache_until to force update with Torn Stats next time they visit a player profile
    .then((m) => {
      if (m?.status == false) {
        displayError(`${m?.message}`);
      }

      //if any new stats have been added, refresh TS
      if ($('.re_new:visible').length) {
        var new_stats = [];
        $('.re_new:visible').each(function() {
          const t = $(this).find('.re_table_label').text();
          new_stats.push(t);
          $(this).removeClass('.re_new');
        })


          getTornStats(`spy/user/${uid}`, 8, true)
          .then((data) => {
            if (data?.status == false) {
              throw data.message;
            }
            delete data.spy;
            delete data.attacks;
            TS_DATA.compare = data.compare;
            parseTornStatsData(data);
          })  

        .catch((e) => {
          displayError(e);
          console.error(e);
        })    
      }
    })
    .then(() => {
        $('.re_stat:not(:visible)').remove(); //remove deleted stats
        end_modify();
    })
    .catch((err) => displayError(`Torn Stats Error: ${err}`))



  }

  function end_modify() {
    const parent = $('#re_compare .re_infotable.re_modify_active');
    parent.sortable("destroy");
    parent.removeClass('re_modify_active');
    $('.re_grip').remove();
    $('.re_delete').remove();
    $('.re_stat').show();
    $('.re_new').remove();
    $('#re_modify_form').remove();
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

  function insert_age_text() {
    if (!features?.pages?.profiles?.age_to_text?.enabled) return;
    const profile_info_wrap = $('.profile-information-wrapper');
    const days = parseInt(profile_info_wrap.find('.box-info.age ul.box-value').text());
    const days_string = days ? getStringFromDays(days) : "0 days";

    profile_info_wrap.addClass("re_age_to_text");
    const age_box = profile_info_wrap.find('.box-info.age');
    age_box.after(`<div class="re_age_text">${days_string}</div>`);
  }
  
  })();