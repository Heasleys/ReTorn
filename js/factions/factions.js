(function() {
const target = document.querySelector('.content-wrapper');
const obsOptions = {attributes: false, childList: true, characterData: false, subtree:true};
const terrRegex = /war\/\d+/;
var allMembers = {};


var crimeObserver = new MutationObserver(function(mutations, observer) {
  let hash = location.hash;
  if (hash.includes('tab=crimes') && $('.faction-crimes-wrap > .begin-wrap .crimes-list').length == 1 && $('.faction-crimes-wrap > .organize-wrap .crimes-list').length == 1) {
      crimesTab();
      crimeObserver.disconnect();
  }
});

var rosterObserver = new MutationObserver(function(mutations, observer) {
  let hash = location.hash;
  if (hash.includes('tab=controls') && $('ul.control-tabs').length == 1 && $('#tornstats-roster').length == 0) {
    rosterTab();
    rosterObserver.disconnect();
  }
});

var rankedWarObserver = new MutationObserver(function(mutations, observer) {
  let hash = location.hash;
  if (hash.includes('war/rank') && $('div.faction-war').length == 1 && $('#re_rankedwar').length == 0) {
    rankedWar();
    rankedWarObserver.disconnect();
  }
});

//territory war spy filter
var territoryWarObserver = new MutationObserver(function(mutations, observer) {
  const hash = location.hash;
  if (hash.match(terrRegex) && $('div.faction-war').length == 1 && $('.re_territorywar').length == 0) {
    territoryWarObserver.disconnect();
    territoryWar();
  }
});


//faction page member battle stats
var factionPageMemberStatsObserver = new MutationObserver(function(mutations, observer) {
  if ($('.faction-info-wrap.another-faction .members-list .table-header .member').length == 1 && $('.re_faction_stats').length == 0) {
    factionPageMemberStatsObserver.disconnect();
    factionPageMemberStats();
  }
});


urlHandler();
window.addEventListener('hashchange', hashHandler, false);


function hashHandler() {
  var hash = location.hash;
  if (hash.includes('tab=crimes') || hash.includes('tab=controls') || hash.includes('war/rank') || hash.match(terrRegex)) {
     urlHandler();
  }
}

function urlHandler() {
  let url = location.href;
  if (url.includes('tab=crimes') && features?.pages?.factions?.oc_tab?.enabled) {
     crimeObserver.observe(target, obsOptions);
  } else {
    crimeObserver.disconnect();
  }

  if (url.includes('tab=controls') && features?.pages?.factions?.roster_tab?.enabled) {
    rosterObserver.observe(target, obsOptions);
  } else {
    rosterObserver.disconnect();
  }

  if (url.includes('war/rank') && features?.pages?.factions?.ranked_war_filter?.enabled) {
    rankedWarObserver.observe(target, obsOptions);
  } else {
    rankedWarObserver.disconnect();
  }

  if (url.match(terrRegex)) { //&& features?.pages?.factions?.territory_war_filter?.enabled
    territoryWarObserver.observe(target, obsOptions);
  } else {
    territoryWarObserver.disconnect();
  }

  if (url.includes('step=profile&ID=')) { //&& features?.pages?.factions?.member_stats?.enabled
    factionPageMemberStatsObserver.observe(target, obsOptions);
  } else {
    factionPageMemberStatsObserver.disconnect();
  }

}

//Organized Crimes Tab
function crimesTab() {
  getTornStats("faction/crimes")
  .then((data) => {
    if (!data?.status) return;
    if (!data.members) return;

    if ($('.faction-crimes-wrap > .begin-wrap .crimes-list').length == 1 && $('.faction-crimes-wrap > .organize-wrap .crimes-list').length == 1 && Object.keys(data?.members).length > 0) {
      $('.faction-crimes-wrap > .begin-wrap .crimes-list, .faction-crimes-wrap > .organize-wrap .crimes-list').each(function() {
        var crimeList = $(this);
        if (!crimeList.hasClass("re_nnb")) {
          crimeList.addClass("re_nnb");
          crimeList.find('li.item-wrap').each(function(index) {
            let itemWrap = $(this);
            // Find the column to insert NNB after (offences for planning, level for already planned OCs)
            let titleInsert = itemWrap.find('ul.title > li.offences');
            if (titleInsert.length == 0) {
              titleInsert = itemWrap.find('ul.title > li.level');
            }
  
            if (titleInsert.length != 0) {
              titleInsert.after(`<li class="nnb" title="Natural Nerve Bar">NNB<div class="t-delimiter white"></div></li>`);
              itemWrap.find('.viewport ul.plans-list>li, .details-wrap ul.details-list>li').each(function() {
                let item = $(this).find('ul.item');
                if (item.length != 0) {
                  let id = item.find('li.member > a').attr('href').replace(/\D/g, "");
                  let wrap = "";
                  if (data.members[id]) {
                    if (data.members[id].natural_nerve) {
                      wrap += data.members[id].natural_nerve;
                    }
                    if (data.members[id].verified == 1) {
                      wrap += ` <span title="API Verified">✔️</span>`;
                    } else {
                      wrap += ` <span title="API Not Verified">❌</span>`;
                    }
                  } else {
                    wrap = `<span title="Not in Torn Stats">--</span>`;
                  }
  
                  // Look for column to insert NNB into (offense for planning, level for already planned OCs)
                  let itemInsert = item.find('li.offences');
                  if (itemInsert.length == 0) {
                    itemInsert = item.find('li.level');
                  }
                  if (itemInsert.length != 0) {
                    itemInsert.after(`<li class="nnb"><span class="t-hide"></span>`+wrap+`</li>`);
                  }
  
                }
              });
            }
          });
        }
      });
    }
  })
  .catch((e) => console.error(e))
  
  //ready ocs header
  if ($('#re_ready_ocs').length == 0) {
    $('#faction-crimes').prepend(`
      <div class="re_head mt2">
        <span class="re_title"><span class="re_logo"><span class="re_yellow">Re</span>Torn</span></span>
        <span class="re_checkbox">
          <label class="re_title noselect" >Open ready OCs</label>
          <input type="checkbox" id="re_ready_ocs" name="ready">
        </span>
      </div>
    `);

    $('#re_ready_ocs').prop( "checked", settings?.faction_ocs?.show_ready);
    showReadyOCs(settings?.faction_ocs?.show_ready);

    $('#re_ready_ocs').change(function() {
      const checked = this.checked;
      const obj = {
        "faction_ocs": {
          "show_ready": checked
        }
      }
      sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
      .then((r) => {
          settings.faction_ocs.show_ready = checked;
          showReadyOCs(checked);
      })
      .catch((e) => console.error(e))
    });

    $('.re_checkbox > label').click(function() {
      let checkbox = $(this).parent('.re_checkbox').find('input[type="checkbox"]');
      checkbox.prop("checked", !checkbox.prop("checked"));
      checkbox.trigger("change");
    });
  }
}



//Roster Tab
function rosterTab() {
    getTornStats("faction/roster")
    .then((data) => {
      if (!data?.status) return;
      if (!data?.members) return;

      Object.entries(data.members).forEach(([key, value]) => {
        data.members[key]['userid'] = key;
        if (value.total == "N/A") {
          data.members[key]['total'] = 0;
        }
      });

      if ($('ul.control-tabs.ui-tabs-nav').length == 1 && Object.keys(data?.members).length > 0) {

        $('ul.control-tabs.ui-tabs-nav').append(`<li class="white-grad bold">Torn Stats:</li>`);
        $('ul.control-tabs.ui-tabs-nav').append(`
          <li data-disable="0" class="ui-state-default ui-corner-top re_ts_roster" role="tab" tabindex="-1" aria-controls="tornstats-roster" aria-labelledby="ui-id-50" aria-selected="false">
            <a id="ts-roster" class="t-gray-3 ui-tabs-anchor" role="presentation" tabindex="-1" id="ui-id-50">
            Torn Stats Roster
            </a>
          </li>
          `);

        $('div.faction-controls-wrap').append(`<div id="tornstats-roster" class="tornstats-roster cont-gray control-tab-section ui-tabs-panel ui-widget-content ui-corner-bottom" aria-labelledby="ui-id-50" role="tabpanel" aria-expanded="false" aria-hidden="true" style="display: none;"></div>`);

        let roster_table = '<table><tr><th class="rank">Rank</th><th>Member</th><th>Total Stats</th><th>API Verified</th></tr>';
        let i = 1;
        let avgI = 0;

        const members = Object.values(data?.members).sort((a, b) => a.total - b.total).reverse();
        var facTotal = 0;
        Object.entries(members).forEach(([key, value]) => {
          let verified = value.verified == 1 ? "Yes" : "No";
          let total = value.total == 0 ? "Hidden" : value.total.toLocaleString();
          if (value.total != 0) {avgI++}
          roster_table += `<tr><td class="rank">#`+i+`</td><td class="member"><a href="https://www.torn.com/profiles.php?XID=`+value.userid+`" target="_blank">`+value.name+` <span class='userid'>[`+value.userid+`]</span></a></td><td class="stats">`+total+`</td><td class="verified" data-verified="`+value.verified+`">`+verified+`</td></tr>`;
          i++;
          facTotal += value.total;
        });
        let facAvg = Math.trunc(facTotal/avgI).toLocaleString("en-US");
        roster_table += `<tfoot><tr><td class="rank"></td><td class="stats">Average Stats:</td><td class="stats">${facAvg}</td><td class="verified"></td></tr></tfoot>`;
        roster_table += "</table>";

        $('#tornstats-roster').html(roster_table);
        $('td.verified[data-verified=0]').addClass('red');
        $('td.verified[data-verified=1]').addClass('green');

        $('#ts-roster').click(function() {
          rosterClick();
        });

        $('ul.control-tabs > li > a:not("#ts-roster")').click(function() {
          $('div#tornstats-roster').hide();
          let last_tab = $('#ts-roster').data('last-tab');
          if ($(this).attr('href') == last_tab) {
            $(this).parent().addClass("ui-tabs-active ui-state-active").attr('tabindex', 0).attr('aria-selected', 'true');
            $(last_tab).show();
            if (location.hash.includes("option=")) {
              location.replace(location.hash.replace(/(?<=option=).*$/, last_tab.replace('#option-', '')));
            } else {
              location.replace(location.hash.replace(/(?<=tab=).*$/, `controls&option=${last_tab.replace('#option-', '')}`));
            }
          }
        });

        if (location.hash.includes('option=tornstats')) {
          rosterClick();
        }
      }
    })
}

//Function for clicking the Roster button on desktop
function rosterClick() {
  $('div.control-tab-section').hide();
  $('#ts-roster').data('last-tab', $('ul.control-tabs li.ui-state-default[tabindex=0]').children('a').attr('href'));
  $('li.ui-state-default[tabindex=0]').removeClass("ui-tabs-active ui-state-active").attr('tabindex', -1).attr('aria-selected', 'false');
  $('div.control-tab-section[aria-expanded="true"]').attr('aria-expanded', 'false').attr('aria-hidden', 'true');
  $('div#tornstats-roster').show();
  if (location.hash.includes("option=")) {
    location.replace(location.hash.replace(/(?<=option=).*$/, "tornstats"));
  } else {
    location.replace(location.hash.replace(/(?<=tab=).*$/, "controls&option=tornstats"));
  }
}

//function for adding the Ranked War filter header
function rankedWar() {
  //stop and ignore if territory wars
  if ($('.faction-war-info').find('a[href*="#terrName"]').length > 0) {
    return;
  }
  //stop and ignore on raids
  if ($('.desc-wrap.raid-members-list').length > 0) {
    return;
  }
  
  //Insert Header
  if ($('.re_container[data-feature="ranked_war_filter"]').length <= 0) {
    insertHeader($("ul.f-war-list"), 'before', 'ranked_war_filter');
    $('.re_head .re_title').after(`<span class="re_checkbox" id="re_disable_filters">
      <label class="re_title noselect">Disable filters</label>
      <input type="checkbox" title="Disable filters">
    </span>`);

    //insert button into header menu to refresh Torn Stats War data manually
    $('#re_features_settings_view').prepend('<li id="re_war_refresh"><span class="re_menu_item"><i class="fa-solid fa-arrows-rotate"></i><span class="re_menu_item_text">Refresh war data</span></span></li>')
    //click event to refresh tornstats data
    $('#re_war_refresh').unbind("click").click(function() {
      //cleanup ranked war page first
      $('.re_content').html(`<img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" id="re_loader">
      <p id="re_message" style="display: none;"></p>`);
      featureCleanup('ranked_war_filter');

      getWarID()
      .then((warID) => getTornStats("wars/"+warID, 8, true))//8 hours cached, force update
      .then(() => {
        loadRankedWar();//reload ranked war
      })
      .catch((e) => console.error(e))
    });
  }
  
  //Add loading dots
  $('.re_content').html(`<img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" id="re_loader">
  <p id="re_message" style="display: none;"></p>`);


  loadRankedWar();
}

function loadRankedWar() {
  getWarID()
  //pull ranked war data from Torn Stats
  .then((warID) => getTornStats("wars/"+warID))
  //add data to members lists
  .then((data) => {
    let psList = [];
    let players = {};

    if (data.status) {
      if (data.faction_a && data.faction_a.members) {
        for (const [index, value] of Object.entries(data.faction_a.members)) {
          players[index] = value;
        }
      }
      if (data.faction_b && data.faction_b.members) {
        for (const [index, value] of Object.entries(data.faction_b.members)) {
          players[index] = value;
        }
      }
  
      $('.f-war-list .faction-war').addClass('re_rankedwar'); //Used for CSS styling for less jumpy pages
      $('.tab-menu-cont > div.members-cont > div > .member').after(`<div class="re_spy_title left">Spy<div class="re_sort_icon"></div></div>`);
      
  

  
      //Sorting for spy column
      $('.re_spy_title').click(function() {
        const spyCols = $('.re_spy_title');
        const warDiv = $(this).closest('.faction-war.re_rankedwar')
        
        //send out a React State Change request to sort by player name first
        const className = 'faction-war re_rankedwar';

        const opponentActive = $('.faction-names .enemy').is('[class*=active_]');
        //opponentActive is needed in case of small screen, we don't want to force switch the faction view
        const newStateObj = {
          "opponentActive": opponentActive,
          "sorting": {
            "field": "playername",
            "direction": "desc"
          }
        }
        const e = new CustomEvent("updateState", {detail: {className: className, newState: newStateObj}});
        document.dispatchEvent(e);
        //React State Change Request

        
        const clickedSpyCol = $(this); //then spyCol that was clicked
        const clickedIcon = clickedSpyCol.find('.re_sort_icon');
        let dir = true;  //always sort by largest > smallest first
        if (clickedIcon.hasClass('re_desc')) dir = false;

        spyCols.each(function() {//now change icon for both spyCols to the correct direction
          const spyCol = $(this); 
          const icon = spyCol.find('.re_sort_icon');

          const memberCont = spyCol.closest('.members-cont');
          const memberList = memberCont.find('ul.members-list');
          
          memberCont.find('div[class*="sortIcon_"]').removeClass(function (index, css) {
            return (css.match (/(^|\s)desc_\S+/g) || []).join(' ');
          }).removeClass(function (index, css) {
            return (css.match (/(^|\s)asc_\S+/g) || []).join(' ');
          });

          //actually sort the players based on direction
          if (dir) {
            icon.removeClass('re_asc').addClass('re_desc');
            memberList.find('li').sort(sort_li_desc).appendTo(memberList);
          } else {
            icon.removeClass('re_desc').addClass('re_asc');
            memberList.find('li').sort(sort_li_asc).appendTo(memberList);
          }
        })
      });
      //if another column is clicked, then remove the classes from the spy column
      $('div.members-cont > div > div[class*="tab_"]').click(function() {
        $(this).closest('.faction-war').find('.re_spy_title .re_sort_icon').removeClass('re_asc').removeClass('re_desc');
      })
  
  
  
      $('ul.members-list > li').each(function() {
        let member = $(this);
  
  
        let url = member.find('div.member div[class*="userWrap"] a').attr("href");
        let userid = url.replace("/profiles.php?XID=", "");
        let psTitle, spyTitle, fullTitle;
  
        member.find('[class*="factionWrap"]').hide();
  
        //add personal stats to title
        if (players[userid] && players[userid]["personalstats"]) {
          psTitle = "<b><u>Personal Stats</u></b>";
          for (const [index, value] of Object.entries(players[userid]["personalstats"])) {
            if (index == "timestamp") {
              psTitle += `<br><b>Last Checked: </b>${timeDifference(Date.now(),value*1000)}`;
            } else {
              member.data(index, value);
              if (isNaN(value)) {
                psTitle += `<br><b>${index}: </b>${value}`;
              } else {
                psTitle += `<br><b>${index}: </b>${value.toLocaleString("en-US")}`;
              }
  
              if (!psList.includes(index)) {
                psList.push(index);
              }
            }
  
          }
        }



        let statTot;

        //if spy exists, add to title
        if (players[userid] && players[userid]["spy"]) {
          let timestampStr = "";
          spyTitle = "<b><u>Battle Stats</u></b>";
          for (const [index, value] of Object.entries(players[userid]["spy"])) {
            if (index == "timestamp") {
              timestampStr = `<br><b>Last Spy: </b>${timeDifference(Date.now(),value*1000)}`;
            } else {
              member.data(index, value);
              if (isNaN(value)) {
                spyTitle += `<br><b>${shortnameStats(index)}: </b><span style='float: right; padding-left: 5px;'>${value}</span>`;
              } else {
                statTot = value;
                spyTitle += `<br><b>${shortnameStats(index)}: </b><span style='float: right; padding-left: 5px;'>${value.toLocaleString()}</span>`;
              }
            }
  
          }
          spyTitle += timestampStr;
        }
        
        if (psTitle) {
          member.find(".member [class*='userInfoBox_']").append(`<i class="fas fa-info-circle re_spy_ps" style="margin-left: auto; padding-right: 3px;"></i>`);

          if (spyTitle) {
            if (statTot) {//total stats available for abbreviated number
              member.find(".member").after(`<div class="re_spy_col left"><span class="re_spy_spy">${abbreviateNumber(statTot)}</span></div>`);
            } else { //no total stats, so place eye icon instead
              member.find(".member").after(`<div class="re_spy_col left"><i class="fas fa-eye re_spy_spy"></i></div>`);
            }
          } else {//no spies
            member.find(".member").after(`<div class="re_spy_col left" title="Spy data not available.">N/A</div>`)
          }
        } else {//no spies or playerstats
          member.find(".member").after(`<div class="re_spy_col left" title="No data available.">N/A</div>`)
        }
  
        if (psTitle) {
          member.find(".re_spy_ps").attr("title", psTitle);
        }
        if (spyTitle) {
          member.find(".re_spy_spy").attr("title", spyTitle);
        }
      });
    } else {
      if (data.message == "re_torn_stats_apikey is empty.") {
        $('.re_content').prepend(`<div class="re_row"><p>You must link your <b><a href="https://www.tornstats.com/"  target="_blank">Torn Stats</a></b> account to filter by battle stats and personal stats. <a id='re_options'>Click here</a> to view the ReTorn options.</p></div>`)
      } else {
        $('.re_content').prepend(`<div class="re_row"><p class="re_error">${data.message}</p></div>`)
      }
    }
    
    return psList;
  })
  //insert information into header (buttons/text) and input functions
  .then((psList) => {
    let psStr = `<select class="mb1" id="re_ps_select"><option selected value="">Hide user if...</option>`;
    psStr += `<option value="offline">Offline</option><option value="idle">Idle</option><option value="online">Online</option><option value="not okay">Not Okay</option>`;
    
    //psList will be empty if no Torn Stats data is available
    if (psList.length != 0) psStr += `<option value="strength">Strength</option><option value="defense">Defense</option><option value="speed">Speed</option><option value="dexterity">Dexterity</option><option value="total">Total Stats</option>`;
    
    for (var i = 0; i < psList.length; i++) {
       psStr += `<option value="${psList[i]}">${psList[i]}</option>`;
    }
    psStr += `</select>`;

    let enemyFac = $('.faction-names .name.enemy [class*="text"]').text();
    let friendlyFac = $('.faction-names .name.your [class*="text"]').text();


    $('#re_loader').remove();
    $('.re_content').prepend(`
      <div class="re_row">
      <div>
        ${psStr}
        <div class="switch_wrap switch_row" id="re_ps_wrap" style="display: none;">
          <select>
            <option value="" selected>is...</option>
            <option value="<">Less than</option>
            <option value=">">Greater than</option>
            <option value="=">Equal to</option>
          </select>
          <input type="text" placeholder="value">
          <button class="re_torn_button" type="button">Add</button>
        </div>
      </div>
      <div class="switch_wrap" id="re_rw_rules">
        <p class="re_ptitle">Filter Rules</p>
          <div class="re_scrollbox">
            <ul class="re_list" id="re_filter_rules">
            <li><div class="re_list_item item">No filter rules being applied.</div></li>
            </ul>
          </div>
        </div>
      </div>
      `);

      const onlineIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="default___qrLNi " filter="" fill="url(&quot;#svg_status_online&quot;)" stroke="#fff" stroke-width="0" width="13" height="13" viewBox="-1.5 -1.2 14 14"><path d="M0,6a6,6,0,1,1,6,6A6,6,0,0,1,0,6Z"></path></svg>`;
      const idleIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="default___qrLNi " filter="" fill="url(&quot;#svg_status_idle&quot;)" stroke="#fff" stroke-width="0" width="13" height="13" viewBox="-1.5 -1.2 14 14"><g xmlns="http://www.w3.org/2000/svg"><path d="M0,6a6,6,0,1,1,6,6A6,6,0,0,1,0,6Z"></path><path d="M5,3V7H9V6H6V3Z" fill="#f2f2f2"></path></g></svg>`;
      const offlineIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="default___qrLNi " filter="" fill="url(&quot;#svg_status_offline&quot;)" stroke="#fff" stroke-width="0" width="13" height="13" viewBox="-1.5 -1.2 14 14"><g xmlns="http://www.w3.org/2000/svg"><path d="M0,6a6,6,0,1,1,6,6A6,6,0,0,1,0,6Z"></path><path d="M3,5H9V7H3Z" fill="#f2f2f2"></path></g></svg>`;    


      $(`.faction-names .name.enemy`).append(`<div class="re_enemy_count re_mem_count">
      <p>Showing <span class="re_enemy">0</span> of <span class="re_enemy_max">0</span> ${enemyFac} members</p>
      <p class="re_playercounts">${onlineIcon}<span class="onlineCount">0</span> ${idleIcon}<span class="idleCount">0</span> ${offlineIcon}<span class="offlineCount">0</span></p>
      </div>`);

      $(`.faction-names .name.your`).append(`<div class="re_your_count re_mem_count">
      <p>Showing <span class="re_your">0</span> of <span class="re_your_max">0</span> ${friendlyFac} members</p>
      <p class="re_playercounts">${onlineIcon}<span class="onlineCount">0</span> ${idleIcon}<span class="idleCount">0</span> ${offlineIcon}<span class="offlineCount">0</span></p>
      </div>`);

      countPlayerStatus();



      $('#re_ps_select').change(function() {        
        if ($(this).val()) {
          $('#re_ps_wrap').show();
        } else {
          $('#re_ps_wrap').hide();
        }

        if ($(this).val() == "offline" || $(this).val() == "idle" || $(this).val() == "online" || $(this).val() == "not okay") {
          $('#re_ps_wrap select').prop("selectedIndex", 3);
          $('#re_ps_wrap select').prop('disabled', true).hide();
          $('#re_ps_wrap input').prop('disabled', true).hide().val(1);
        } else {
          $('#re_ps_wrap select').prop("selectedIndex", 0);
          $('#re_ps_wrap select').prop('disabled', false).show();
          $('#re_ps_wrap input').prop('disabled', false).show();
          $('#re_ps_wrap input').val("");
        }
      });

        //click events for disable filter label and checkbox
      $('#re_disable_filters').click(function(e) {
        e.stopPropagation();
        const checkbox = $(this).find('input[type=checkbox]');
        checkbox.prop("checked", checkbox.prop("checked"));
        rankedWarFilters();
      });
      $('.re_checkbox > label').click(function() {
        let checkbox = $(this).parent('.re_checkbox').find('input[type="checkbox"]');
        checkbox.prop("checked", !checkbox.prop("checked"));
        checkbox.trigger("change");
      });

      /* event listener from interceptFetch for when user status changes */
      document.addEventListener("re_ranked_wars_fetch", re_ranked_wars_fetch_eventListener);

      $(document).on('click', '#re_filter_rules .re_list_item.x .remove-link .delete-subscribed-icon', function() {
        const parent = $(this).closest('li');
        const index = parent.attr('data-index');
        if (index != undefined && parent.length > 0) {
          sendMessage({name: "del_settings_index", key: index, setting: "ranked_war_filters"})
          .then((r) => {
            parent.remove();
            delete settings.ranked_war_filters[index];
            settings.ranked_war_filters = fixIndexAfterDelete(index, settings.ranked_war_filters);
            rankedWarFilters();
          })
          .catch((e) => console.error(e))
        }
      });

      //set letters to numbers
      $('#re_ps_wrap input').on('change, keyup', function() {
        var currentInput = $(this).val().toLowerCase();
        if (!/\.$/.test(currentInput)) {
          var numVal = Number(currentInput.replace(/[^0-9.]+/g, ''));
          if (/\d+k$/.test(currentInput)) numVal *= 1000;
          if (/\d+m$/.test(currentInput)) numVal *= 1000000;
          if (/\d+b$/.test(currentInput)) numVal *= 1000000000;
          if (/\d+t$/.test(currentInput)) numVal *= 1000000000000;

          if (numVal) {
            $(this).val(numVal.toLocaleString("en-US"));
          }
        }
      });

      $('#re_ps_wrap button').click(function() {
        const option = $( "#re_ps_select" ).find(":selected").val();
        const inequalities = $('#re_ps_wrap select').val();
        const num = $('#re_ps_wrap input').val().replace(/[^0-9]+/g, '');  


        if (option && inequalities && num) {
          resetFilterInputs();


          const index = Object.keys(settings?.ranked_war_filters).length;

          const obj = {
            "ranked_war_filters": {
              [index]: {
                "option": option,
                "eq": inequalities, 
                "value": num
              }
            }
          }

          settings["ranked_war_filters"][index] = {"option": option, "eq": inequalities, "value": num};
          
          sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
          .then((r) => {
            rankedWarFilters();
          })
          .catch((e) => console.error(e))

        } else {
          if (!option) {
            $('#re_ps_select').addClass("error");
            setTimeout(function() {
              $('#re_ps_select').removeClass("error");
            }, 2000);
          }
          if (!inequalities) {
            $('#re_ps_wrap select').addClass("error");
            setTimeout(function() {
              $('#re_ps_wrap select').removeClass("error");
            }, 2000);
          }
          if (!num) {
            $('#re_ps_wrap input[type="text"]').addClass("error");
            setTimeout(function() {
              $('#re_ps_wrap input[type="text"]').removeClass("error");
            }, 2000);
          }
        }
      })
  })
  //pull filters and apply filters
  .then(() => {
    rankedWarFilters();
  })
  .catch((err) => {
    console.log("[ReTorn][Ranked War Filter] Error: ", err);
    $('#re_loader').remove();
    $('#re_message').html(`<span class="re_error">${err}</span>`);
    $('#re_message').show();
  });
}

function getWarID() {
  return new Promise((resolve, reject) => {
    if ($('.f-war-list [class*="rankBox"]').length == 1) {
      if ($('.f-war-list [class*="rankBox"]').data("warid")) {
        let warID = $('.f-war-list [class*="rankBox"]').data("warid");
        return resolve(warID);
      }
    }
    return reject();
  });
}

function rankedWarFilters() {
  const filters = settings?.ranked_war_filters;
  $('#re_filter_rules').empty();

  filterUsers(filters);

  //add the filters to rule list
  for (const [index, data] of Object.entries(filters)) {
    if (data.option == "offline" || data.option == "idle" || data.option == "online" || data.option == "not okay") {
      $('#re_filter_rules').prepend(`<li data-index="${index}" data-option="${data.option}"><div class="re_list_item x"><a class="remove-link"> <i class="delete-subscribed-icon"></i> </a></div><div class="re_list_item item">Hide user if ${data.option}</div></li>`);
    } else {
      $('#re_filter_rules').prepend(`<li data-index="${index}" data-option="${data.option}"><div class="re_list_item x"><a class="remove-link"> <i class="delete-subscribed-icon"></i> </a></div><div class="re_list_item item">Hide user if ${data.option} ${data.eq} ${parseInt(data.value).toLocaleString("en-US")}</div></li>`);
    }
  }

  if (Object.keys(filters).length == 0) {
    $('#re_filter_rules').prepend(`<li><div class="re_list_item item">No filter rules being applied.</div></li>`);
  }
}

function filterUsers(filters) {
  //actually filter the players
  if (!$('#re_disable_filters input[type="checkbox"]').is(":checked")) { //if filter rules checkbox is not checked, proceed
    $('ul.members-list > li').each(function() { //for each member
      $(this).show().addClass("re_show");

      for (const [index, data] of Object.entries(filters)) { //for each filter
        if ($(this).data(data.option)  != undefined) {
          if (data.eq == "<") {
            if ($(this).data(data.option) < data.value) {
              $(this).hide().removeClass("re_show");
            }
          }
          if (data.eq == ">") {
            if ($(this).data(data.option) > data.value) {
              $(this).hide().removeClass("re_show");
            }
          }
          if (data.eq == "=") {
            if ($(this).data(data.option) == data.value) {
              $(this).hide().removeClass("re_show");
            }
          }
        }

        //user activity (offline, idle, online)
        if (data.option == "offline" || data.option == "idle" || data.option == "online") {
          const domID = $(this).find('[class*="userStatusWrap_"]').attr('id');
          if (domID.includes(data.option)) $(this).hide().removeClass("re_show");
        }

        // hide user if Status is not okay
        if (data.option == "not okay") {
          if ($(this).find('.status.not-ok').length > 0) $(this).hide().removeClass("re_show");
        }
      }
    
    });
  } else {
    $('ul.members-list > li').show().addClass("re_show");
  }

  //set the number of shown members for each faction
  let yourCount = $('ul.members-list > li.your.re_show').length;
  let enemyCount = $('ul.members-list > li.enemy.re_show').length;
  $('.re_enemy_count .re_enemy').text(enemyCount);
  $('.re_enemy_count .re_enemy_max').text($('ul.members-list > li.enemy').length);
  $('.re_your_count .re_your').text(yourCount);
  $('.re_your_count .re_your_max').text($('ul.members-list > li.your').length);
}

function resetFilterInputs() {
  $('#re_ps_select').prop("selectedIndex", 0);
  $('#re_ps_wrap select').prop("selectedIndex", 0);
  $('#re_ps_wrap select').prop('disabled', false).show();
  $('#re_ps_wrap input').prop('disabled', false).show();
  $('#re_ps_wrap input').val("");
  $('#re_ps_wrap').hide();
}

function showReadyOCs(checked) {
  $('ul.crimes-list > li.item-wrap').each(function() {
    if ($(this).find('ul.item li.status:contains("Ready")').length > 0) {
      if ($(this).find('.stat.stat-red').length == 0) {
        if (checked) {
          $(this).addClass('active');
        } else {
          $(this).removeClass('active');
        }
      } else {
        $(this).find('ul.item li.status').html(`<span class="bold t-red">${$(this).find('.stat.stat-red').length} Not Ready</span>`)
      }
    }
  });
}

function countPlayerStatus() {
  //count offline, online, idle
  const statuses = ["offline", "idle", "online"]
  statuses.forEach(function(e) {
    let enemyCount = $('.enemy-faction ul.members-list .member.icons [id*="'+e+'"]').length;
    $('.re_enemy_count .'+e+'Count').text(enemyCount);

    let yourCount = $('.your-faction ul.members-list .member.icons [id*="'+e+'"]').length;
    $('.re_your_count .'+e+'Count').text(yourCount);
  });
}

function re_ranked_wars_fetch_eventListener() {
  const filters = settings?.ranked_war_filters;
  if (features?.pages?.factions?.ranked_war_filter?.enabled) {
    countPlayerStatus();
    filterUsers(filters);
  }
}

function territoryWar() {
  //stop and ignore if ranked wars
  if ($('.faction-war-info[class*="factionWarInfo_"]').length > 0) {
    return;
  }
  //stop and ignore on raids
  if ($('.desc-wrap.raid-members-list').length > 0) {
    return;
  }

  //Insert Header
  if ($('.re_container[data-feature="territory_war_filter"]').length <= 0) {
    insertHeader($("ul.f-war-list"), 'before', 'territory_war_filter');
    $('.re_head .re_title').after(`<span class="re_checkbox" id="re_disable_filters">
      <label class="re_title noselect">Disable filters</label>
      <input type="checkbox" title="Disable filters">
    </span>`);

    //insert button into header menu to refresh Torn Stats War data manually
    $('#re_features_settings_view').prepend('<li id="re_war_refresh"><span class="re_menu_item"><i class="fa-solid fa-arrows-rotate"></i><span class="re_menu_item_text">Refresh war data</span></span></li>')
    //click event to refresh tornstats data
    $('#re_war_refresh').unbind("click").click(function() {
      //cleanup ranked war page first
      $('.re_content').html(`<img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" id="re_loader">
      <p id="re_message" style="display: none;"></p>`);
      featureCleanup('territory_war_filter');

      var promises = [];
      const a = $('.faction-war-info a[href*="step=profile&ID="');

      if (a.length == 2) {
        $.each(a, function(i,e) {
          const factionID = $(e).attr('href').match(/\d+/);
          var promise = getTornStats("spy/faction/"+factionID, 8, true);//get tornstats data, force overwrite cache
          promises.push(promise);
        });

        // Wait for all promises to complete before calling loadTerritoryWar
        Promise.all(promises).then(function() {
          loadTerritoryWar();
        });
      }
    });
  }
  
  //Add loading dots
  $('.re_content').html(`<img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" id="re_loader">
  <p id="re_message" style="display: none;"></p>`);


    loadTerritoryWar();
}

function loadTerritoryWar() {
  const a = $('.faction-war-info a[href*="step=profile&ID="');
  //obtain factionIDs for each faction in the territory war
  if (a.length == 2) {
    
    var promises = [];
    const a = $('.faction-war-info a[href*="step=profile&ID="');

    $.each(a, function(i,e) {
      console.log(i,e)
      const factionID = $(e).attr('href').match(/\d+/);
      var promise = getTornStats("spy/faction/"+factionID);
      promises.push(promise);
    });

    // Wait for all promises to complete before calling loadTerritoryWar
    Promise.all(promises)
    .then(function(dataArray) {
      console.log(dataArray);

      dataArray.forEach((data) => {
        console.log(data)
        if (data?.faction?.members && Object.keys(data.faction.members)) {
          for (const [id, member] of Object.entries(data.faction.members)) {
            allMembers[id] = member;
          }
        }
      });
    })
    .then(function() {
      $('.f-war-list .faction-war').addClass('re_territorywar'); //Used for CSS styling for less jumpy pages
      $('.tab-menu-cont > div.members-cont > div.title > .members').after(`<div class="re_spy_title left">Spy</div>`);

      const membersElements = $('.tab-menu-cont .members-list > li:not(.join)');

      return genericSpyFunction(membersElements, `.user.name`);
    })
    .then(function() {
      /* event listener from interceptFetch for when user status changes */
      document.addEventListener("re_territory_wars_fetch", re_territory_wars_fetch_eventListener);
    })
  }


  function re_territory_wars_fetch_eventListener() {
    console.log("re_territory_wars_fetch_eventListener");
    const membersElements = $('.tab-menu-cont .members-list > li:not(.join)');

    return genericSpyFunction(membersElements, `.user.name`);
  }







}

function shortnameStats(stat) {
  switch (stat) {
    case "defense":
      return "DEF";  
    break;
    case "strength":
      return "STR";  
    break;
    case "dexterity":
      return "DEX";  
    break;
    case "speed":
      return "SPD";  
    break;
    case "total":
      return "TOTAL"
    break;
    default:
      return stat;
    break;
  }
}



function factionPageMemberStats() {
  console.log('factionPageMemberStats')
  $('.members-list').parent('.faction-info-wrap').addClass('re_faction_stats');
  $('.faction-info-wrap.re_faction_stats .members-list .table-header .member').after(`<div class="re_spy_title left">Spy<div class="re_sort_icon"></div></div>`);

  const factionID = $('.faction-profile .faction-info').attr('data-faction');

  getTornStats("spy/faction/"+factionID)
  .then(function(data) {
    console.log(data);

    if (data?.faction?.members && Object.keys(data.faction.members)) {
      for (const [id, member] of Object.entries(data.faction.members)) {
        allMembers[id] = member;
      }
    }

    const membersElements = $('.re_faction_stats ul.table-body li.table-row');

    return genericSpyFunction(membersElements, `[class*='userWrap'] [class*='linkWrap']`)
  })
  .then(function() {
      //Sorting for spy column
      $('.re_spy_title').click(function() {
        const spyCols = $('.re_spy_title');
        
        //send out a React State Change request to sort by player name first
        const className = 'faction-info-wrap restyle another-faction re_faction_stats';

        const newStateObj = {
          "sorting": {
            "field": "playername",
            "direction": "desc"
          }
        }
        const e = new CustomEvent("updateHook", {detail: {className: className, newState: newStateObj}});
        document.dispatchEvent(e);
        //React State Change Request

        
        const clickedSpyCol = $(this); //then spyCol that was clicked
        const clickedIcon = clickedSpyCol.find('.re_sort_icon');
        let dir = true;  //always sort by largest > smallest first
        if (clickedIcon.hasClass('re_desc')) dir = false;

        spyCols.each(function() {//now change icon for both spyCols to the correct direction
          const spyCol = $(this); 
          const icon = spyCol.find('.re_sort_icon');

          const memberCont = spyCol.closest('.members-list');
          const memberList = memberCont.find('ul.table-body');
          
          memberCont.find('div[class*="sortIcon_"]').removeClass(function (index, css) {
            return (css.match (/(^|\s)desc_\S+/g) || []).join(' ');
          }).removeClass(function (index, css) {
            return (css.match (/(^|\s)asc_\S+/g) || []).join(' ');
          });

          //actually sort the players based on direction
          if (dir) {
            icon.removeClass('re_asc').addClass('re_desc');
            memberList.find('li').sort(sort_li_desc).appendTo(memberList);
          } else {
            icon.removeClass('re_desc').addClass('re_asc');
            memberList.find('li').sort(sort_li_asc).appendTo(memberList);
          }
        })
      });
      //if another column is clicked, then remove the classes from the spy column
      $('.re_faction_stats .members-list ul.table-header > li.table-cell').click(function() {
        $(this).closest('.members-list').find('.re_spy_title .re_sort_icon').removeClass('re_asc').removeClass('re_desc');
      })
  })
  .catch((e) => console.error(e))
}


const SI_PREFIXES = [
  { value: 1, symbol: '' },
  { value: 1e3, symbol: 'K' },
  { value: 1e6, symbol: 'M' },
  { value: 1e9, symbol: 'B' },
  { value: 1e12, symbol: 't' },
  { value: 1e15, symbol: 'q' },
  { value: 1e18, symbol: 'Q' },
  { value: 1e21, symbol: 's' },
  { value: 1e24, symbol: 'S' }
]

const abbreviateNumber = (number) => { //https://stackoverflow.com/questions/10599933/convert-long-number-into-abbreviated-string-in-javascript-with-a-special-shortn
  if (number === 0) return number

  const tier = SI_PREFIXES.filter((n) => number >= n.value).pop()
  const numberFixed = (number / tier.value).toFixed(1)

  return `${numberFixed}${tier.symbol}`
}


function genericSpyFunction(membersElements, useridSelection) {
  var psList = [];
  if (Object.keys(allMembers)) {
    if (membersElements.length) {
      $.each(membersElements, function(i,member) {
        if ($(member).find('.re_spy_col').length) {
          console.log(`already has a spy column`)
          return;
        }
        const userid = $(member).find(`${useridSelection}`).attr("href").match(/\d+/);
        if (allMembers[userid]) {
          console.log(allMembers[userid]);

          let psTitle, spyTitle;

          //add personal stats to title
          if (allMembers[userid] && allMembers[userid]["personalstats"]) {
            psTitle = "<b><u>Personal Stats</u></b>";
            for (const [index, value] of Object.entries(allMembers[userid]["personalstats"])) {
              if (index == "timestamp") {
                psTitle += `<br><b>Last Checked: </b>${timeDifference(Date.now(),value*1000)}`;
              } else {
                $(member).data(index, value);
                if (isNaN(value)) {
                  psTitle += `<br><b>${index}: </b>${value}`;
                } else {
                  psTitle += `<br><b>${index}: </b>${value.toLocaleString("en-US")}`;
                }
    
                if (!psList.includes(index)) {
                  psList.push(index);
                }
              }
    
            }
          }



          let statTot;

          //if spy exists, add to title
          if (allMembers[userid] && allMembers[userid]["spy"]) {
            let timestampStr = "";
            spyTitle = "<b><u>Battle Stats</u></b>";
            for (const [index, value] of Object.entries(allMembers[userid]["spy"])) {
              if (index == "timestamp") {
                timestampStr = `<br><b>Last Spy: </b>${timeDifference(Date.now(),value*1000)}`;
              } else {
                $(member).data(index, value);
                if (isNaN(value)) {
                  spyTitle += `<br><b>${shortnameStats(index)}: </b><span style='float: right; padding-left: 5px;'>${value}</span>`;
                } else {
                  statTot = value;
                  spyTitle += `<br><b>${shortnameStats(index)}: </b><span style='float: right; padding-left: 5px;'>${value.toLocaleString()}</span>`;
                }
              }
    
            }
            spyTitle += timestampStr;
          }


          
          if (psTitle) {
            if (spyTitle) {
              if (statTot) {//total stats available for abbreviated number
                $(member).find(".member").after(`<div class="re_spy_col left"><span class="re_spy_spy">${abbreviateNumber(statTot)}</span></div>`);
              } else { //no total stats, so place eye icon instead
                $(member).find(".member").after(`<div class="re_spy_col left"><i class="fas fa-eye re_spy_spy"></i></div>`);
              }
            } else {//no spies
              $(member).find(".member").after(`<div class="re_spy_col left" title="Spy data not available.">N/A</div>`)
            }
          } else {//no spies or playerstats
            $(member).find(".member").after(`<div class="re_spy_col left" title="No data available.">N/A</div>`)
          }

          $(member).find(".member").after(`<div class="left"><i class="fas fa-info-circle re_spy_ps" style="position: absolute; margin-left: -18px; margin-top: 10.5px;"></i></div>`);

          if (psTitle) {
            $(member).find(".re_spy_ps").attr("title", psTitle);
          }
          if (spyTitle) {
            $(member).find(".re_spy_spy").attr("title", spyTitle);
          }


        }
      });
    }
  }

  return psList;
}


})();


function sort_li_desc(a, b){
  const b_total = $(b).data('total') != undefined ? $(b).data('total') : 0;
  const a_total = $(a).data('total') != undefined ? $(a).data('total') : 0;
  return (b_total) > (a_total) ? 1 : -1;    
}
function sort_li_asc(a, b){
  const b_total = $(b).data('total') != undefined ? $(b).data('total') : 0;
  const a_total = $(a).data('total') != undefined ? $(a).data('total') : 0;
  return (b_total) < (a_total) ? 1 : -1;    
}


function featureCleanup(feature) {
  if (feature === `ranked_war_filter`) {
    $('.re_spy_title,.re_spy_col,.re_mem_count,.re_spy_ps,.re_spy_spy').remove();
    $('.re_rankedwar').removeClass('re_rankedwar');
    $('[class*="factionWrap"]').show();
    $('ul.members-list > li').show();//show all members in the list
  }
}