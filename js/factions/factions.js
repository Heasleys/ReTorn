var allMembers = {}; //global spy data for faction scripts

(function() {
const target = document.querySelector('.content-wrapper');
const obsOptions = {attributes: false, childList: true, characterData: false, subtree:true};
const terrRegex = /war\/\d+/;



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

//faction page other faction / faction name in tab
var factionPageOtherFactionObserver = new MutationObserver(function(mutations, observer) {
  if ($('#factions .faction-info-wrap.faction-profile').length != 0) {
      //obtain only the faction name, not the respect or any other children text
      const FACTION_NAME = $('#factions .faction-info-wrap.faction-profile > div.title-black')
      .clone()    //clone the element
      .children() //select all the children
      .remove()   //remove all the children
      .end()  //again go back to selected element
      .text();
      
      if (window?.document?.title && FACTION_NAME) {
        window.document.title = `${FACTION_NAME} | TORN`;
        factionPageOtherFactionObserver.disconnect();
      }
  }
});

//faction page member battle stats
var factionPageMemberStatsObserver = new MutationObserver(function(mutations, observer) {
  if ($('.faction-info-wrap.another-faction .members-list .table-header .member').length == 1 && $('.re_faction_stats').length == 0 && $(`.re_container[data-feature="${FACTION_FILTER}"]`).length == 1) {
    factionPageMemberStatsObserver.disconnect();
    initMemberListSpies();
  }
});

var factionMembersFilterObserver = new MutationObserver(function(mutations, observer) {
  if ($(".f-war-list.members-list").parent(".faction-info-wrap").length == 1 && $(`.re_container[data-feature="${FACTION_FILTER}"]`).length == 0) {
    factionMembersFilterObserver.disconnect();
    insertMemberListContainer();
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

  if (url.match(terrRegex)) { //&& features?.pages?.factions?.territory_war_spies?.enabled
    territoryWarObserver.observe(target, obsOptions);
  } else {
    territoryWarObserver.disconnect();
  }

  if (url.includes('step=profile')) {
    if (features?.pages?.factions?.faction_name_in_tab?.enabled) {
      factionPageOtherFactionObserver.observe(target, obsOptions);
    }

    if (features?.pages?.factions?.faction_profile_filter?.enabled) {
      factionMembersFilterObserver.observe(target, obsOptions);
      if (features?.pages?.factions?.faction_profile_spies?.enabled) {
        factionPageMemberStatsObserver.observe(target, obsOptions);
      }
    }

  } else {
    factionPageOtherFactionObserver.disconnect();
    factionPageMemberStatsObserver.disconnect();
    factionMembersFilterObserver.disconnect();
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

    $('#re_ready_ocs').prop("checked", settings?.faction_ocs?.show_ready);
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

})();

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

function getFactionIDFromFactionPage() {
  let factionID;

  //try to get factionID from url (not always available)
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  factionID = urlParams.get('ID');
  if (factionID && !isNaN(factionID)) return parseInt(factionID);


  // Check for factionID in $('#top-page-links-list .view-wars').attr('href')
  var href = $('#top-page-links-list .view-wars').attr('href');
  var match = href.match(/\/ranked\/(\d+)/);
  if (match) {
      factionID = match[1];
      return parseInt(factionID);
  }

  // Check for factionID in $('.faction-info .f-info a[href*="city.php#factionID="]')
  var link = $('.faction-info .f-info a[href*="city.php#factionID="]');
  if (link.length) {
      var hrefParts = link.attr('href').split('=');
      if (hrefParts.length === 2) {
          factionID = hrefParts[1];
          return parseInt(factionID);
      }
  }

  //could not find factionID
  return null;
}

//spy refresh insert function
function insertSettingsSpyRefresh(feature, feature2 = null) {
  const RE_CONTAINER = $(`.re_container[data-feature="${feature}"]`);
  const element = `
  <li class="re_spy_refresh">
      <span class="re_menu_item">
          <i class="fa-solid fa-arrows-rotate"></i>
          <span class="re_menu_item_text">Refresh spy data</span>
      </span>
  </li>
  `;

  RE_CONTAINER.find('#re_features_settings_view').prepend(element);

  if (feature2) { //this is a terrible hack but idc. This should only trigger on memberlist spies refresh
    //Default click event to refresh tornstats data
    RE_CONTAINER.find('.re_spy_refresh').click(function() {
      featureCleanup(feature2);
    });
  } else {
    //Default click event to refresh tornstats data
    RE_CONTAINER.find('.re_spy_refresh').click(function() {
        featureCleanup(feature);
    });
  }

}

//Spy function to be used by all war types and member list
function genericSpyFunction(membersElements, useridSelection) {
  var psList = [];
  if (Object.keys(allMembers)) {
    if (membersElements.length) {
      $.each(membersElements, function(i,member) {
        if ($(member).find('.re_spy_col').length) {
          console.log(`ReTorn: already has a spy column`)
          return;
        }
        //console.log(member)
        const userEl = $(member).find(`${useridSelection}`);
        if (userEl.length) {
          const userid = userEl.attr("href").match(/\d+/);
          if (allMembers[userid]) {
            //console.log(allMembers[userid]);

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
            let elapsed;

          //if spy exists, add to title
          if (allMembers[userid] && allMembers[userid]["spy"]) {
            let timestampStr = "";
            spyTitle = "<b><u>Battle Stats</u></b>";
            let spy = allMembers[userid]["spy"];
            statTot = spy.total;
            spyTitle += `<br><b>${shortnameStats("strength")}: </b><span style='float: right; padding-left: 5px;'>${isNaN(spy["strength"]) ? spy["strength"] : spy["strength"].toLocaleString()}</span>`;
            spyTitle += `<br><b>${shortnameStats("defense")}: </b><span style='float: right; padding-left: 5px;'>${isNaN(spy["defense"]) ? spy["defense"] : spy["defense"].toLocaleString()}</span>`;
            spyTitle += `<br><b>${shortnameStats("speed")}: </b><span style='float: right; padding-left: 5px;'>${isNaN(spy["speed"]) ? spy["speed"] : spy["speed"].toLocaleString()}</span>`;
            spyTitle += `<br><b>${shortnameStats("dexterity")}: </b><span style='float: right; padding-left: 5px;'>${isNaN(spy["dexterity"]) ? spy["dexterity"] : spy["dexterity"].toLocaleString()}</span>`;
            spyTitle += `<br><b>${shortnameStats("total")}: </b><span style='float: right; padding-left: 5px;'>${isNaN(spy["total"]) ? spy["total"] : spy["total"].toLocaleString()}</span>`;
            
            var c = "";
            elapsed = Date.now() - (spy.timestamp*1000);
            if (elapsed > OUTDATED_TIMESTAMP) {
              c = "re_red";
            }
            
            spyTitle += `<br><b>Last Spy: </b><span class=${c}>${timeDifference(Date.now(),spy.timestamp*1000)}</span>`;
            for (const [index, value] of Object.entries(spy)) {
              $(member).data(index, value);
            }
          }


            
            if (psTitle) {
              if (spyTitle) {
                if (statTot) {//total stats available for abbreviated number
                  
                  var o = "";
                  //add outdated icon if outdated
                  if (elapsed && elapsed > OUTDATED_TIMESTAMP) {
                    o = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" class="re_red re_outdated" viewBox="0 0 16 16">
                      <path d="M 4 6 A 0.5 0.5 0 0 1 5 5 L 8 8 L 11 5 A 0.5 0.5 0 1 1 12 6 L 9 9 L 12 12 A 0.5 0.5 0 0 1 11 13 L 8 10 L 5 13 A 0.5 0.5 0 0 1 4 12 L 7 9 L 4 6 A 0.5 0.5 0 0 1 5 5 Z M 3.5 0 A 0.5 0.5 0 0 1 4 0.5 V 1 H 12 V 0.5 A 0.5 0.5 0 0 1 13 0.5 V 1 H 14 A 2 2 0 0 1 16 3 V 14 A 2 2 0 0 1 14 16 H 2 A 2 2 0 0 1 0 14 V 3 A 2 2 0 0 1 2 1 H 3 V 0.5 A 0.5 0.5 0 0 1 3.5 0 Z M 1 4 V 14 A 1 1 0 0 0 2 15 H 14 A 1 1 0 0 0 15 14 V 4 H 1 Z"></path>
                    </svg>
                    `;
                  }

                  $(member).find(".member").after(`<div class="re_spy_col left"><span class="re_spy_spy">${abbreviateNumber(statTot)}</span>${o}</div>`);
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
        }
      });
    }
  }

  return psList;
}

function featureCleanup(feature) {
  if (feature === `ranked_war_filter`) {
    $('.re_rankedwar .re_spy_title,.re_rankedwar .re_spy_col,.re_rankedwar .re_mem_count,.re_rankedwar .re_spy_ps,.re_rankedwar .re_spy_spy').remove();
    $('.re_rankedwar [class*="factionWrap"]').show();
    $('.re_rankedwar ul.members-list > li').show();//show all members in the list

    $('.re_rankedwar').removeClass('re_rankedwar');
  }

  if (feature === `territory_war_spies`) {
    $('.re_territorywar .re_spy_title,.re_territorywar .re_spy_col,.re_territorywar .re_spy_ps,.re_territorywar .re_spy_spy').remove();
    $('.re_territorywar').removeClass('re_territorywar');
  }

  if (feature === `faction_profile_spies`) {
    $('.re_faction_stats .re_spy_title,.re_faction_stats .re_spy_col,.re_faction_stats .re_spy_ps,.re_faction_stats .re_spy_spy').remove();
    $('.re_faction_stats').removeClass('re_faction_stats');
  }
}