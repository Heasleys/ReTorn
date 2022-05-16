// @version      1.0.0
// @description  Adds NNB from TornStats to crime list, adds TornStats roster in controls tab
// @author       Heasleys4hemp [1468764]

(function() {
var target = document.querySelector('.content-wrapper');
var obsOptions = {attributes: false, childList: true, characterData: false, subtree:true};
var tsData = {};

var crimeObserver = new MutationObserver(function(mutations, observer) {
  let hash = location.hash;
  if (hash.includes('tab=crimes') && $('.faction-crimes-wrap > .begin-wrap .crimes-list').length == 1) {
      crimesTab();
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
  if (hash.includes('war/rank') && $('div.faction-war').length == 1 && $('#re_faction_filter').length == 0) {
    rankedWar();
    rankedWarObserver.disconnect();
  }
});




urlHandler();
window.addEventListener('hashchange', hashHandler, false);


function hashHandler() {
  var hash = location.hash;
  if (hash.includes('tab=crimes') || hash.includes('tab=controls') || hash.includes('war/rank')) {
     urlHandler();
  }
}

function urlHandler() {
  let url = location.hash;
  if (url.includes('tab=crimes')) {
     crimeObserver.observe(target, obsOptions);
  } else {
    crimeObserver.disconnect();
  }

  if (url.includes('tab=controls')) {
    rosterObserver.observe(target, obsOptions);
  } else {
    rosterObserver.disconnect();
  }

  if (url.includes('war/rank')) {
    rankedWarObserver.observe(target, obsOptions);
  } else {
    rankedWarObserver.disconnect();
  }
}

//Organized Crimes Tab
function crimesTab() {
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

    chrome.runtime.sendMessage({name: "get_value", value: "re_ocs"}, (response) => {
      if (response.status) {
        if (response.value && response.value.re_ocs) {
          if (response.value.re_ocs.showready) {
            $('#re_ready_ocs').prop( "checked", response.value.re_ocs.showready);
            showReadyOCs(response.value.re_ocs.showready);
          }
        }
      }
    });

    $('#re_ready_ocs').change(function() {
      let checked = this.checked;
      let name = $(this).attr('name');
      chrome.runtime.sendMessage({name: "set_value", value_name: "re_ocs", value: {showready: checked}}, (response) => {
        showReadyOCs(checked);
      });
    });

    $('.re_checkbox > label').click(function() {
      let checkbox = $(this).parent('.re_checkbox').find('input[type="checkbox"]');
      checkbox.prop("checked", !checkbox.prop("checked"));
      checkbox.trigger("change");
    });
  }


  tornstatsSync("crimes")
  .then((data) => {
    if ($('.faction-crimes-wrap > .begin-wrap .crimes-list').length == 1 && $('.faction-crimes-wrap > .organize-wrap .crimes-list').length == 1 && tsData["crimes"]) {
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
                  if (tsData["crimes"].members[id]) {
                    if (tsData["crimes"].members[id].natural_nerve) {
                      wrap += tsData["crimes"].members[id].natural_nerve;
                    }
                    if (tsData["crimes"].members[id].verified == 1) {
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
  .catch((err) => {
    console.log(err);
  });
}

//Roster Tab
function rosterTab() {
    tornstatsSync("roster")
    .then((data) => {
      tsData["roster"] = data;
      if ($('ul.control-tabs.ui-tabs-nav').length == 1 && tsData["roster"]) {

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

        const members = Object.values(tsData["roster"].members).sort((a, b) => a.total - b.total).reverse();
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
          }
        });

        if (location.hash.includes('option=tornstats')) {
          rosterClick();
        }
      }
    })
    .catch((err) => {
      console.log(err);
    });
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
function rankedWar(warID) {
  //stop and ignore if territory wars
  if ($('.faction-war-info').find('a[href*="#terrName"]').length > 0) {
    return;
  }
  //stop and ignore on raids
  if ($('.desc-wrap.raid-members-list').length > 0) {
    return;
  }
  
  //Insert Header
  if ($('.re_container').length <= 0) {
    insertHeader($("ul.f-war-list"), 'before');
    $('#re_title').text("War Filter");
    $('.re_head .re_title').after(`<span class="re_checkbox" id="re_disable_filters">
    <label class="re_title noselect" >Disable filters</label>
      <input type="checkbox">
    </span>`);
  }


  //click events for disable filter label and checkbox
  $('#re_disable_filters').click(function(event) {
    event.stopPropagation();
    let checkbox = $(this).find('input[type="checkbox"]');
    checkbox.prop("checked", checkbox.prop("checked"));
    rankedWarFilters();
  });
  $('.re_checkbox > label').click(function() {
    let checkbox = $(this).parent('.re_checkbox').find('input[type="checkbox"]');
    checkbox.prop("checked", !checkbox.prop("checked"));
    checkbox.trigger("change");
  });
  
  //Add loading dots
  $('.re_content').html(`<img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" id="re_loader">
  <p id="re_message" style="display: none;"></p>`);
  getWarID()
  //pull ranked war data from Torn Stats
  .then((warID) => tornstatsSync("rankedwar", warID))
  //add data to members lists
  .then((data) => {
    let players = {};
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
    $('.tab-menu-cont > div.members-cont > div > .member').after(`<div class="re_spy_title left">Spy</div>`);
    var psList = [];

    $('ul.members-list > li').each(function() {
      let member = $(this);


      let url = member.find('div.member div[class*="userWrap"] a').attr("href");
      let userid = url.replace("/profiles.php?XID=", "");
      let psTitle, spyTitle, fullTitle;

      member.find('[class*="factionWrap"').hide();

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
              spyTitle += `<br><b>${index[0].toUpperCase()}${index.slice(1)}: </b>${value}`;
            } else {
              spyTitle += `<br><b>${index[0].toUpperCase()}${index.slice(1)}: </b>${value.toLocaleString()}`;
            }
          }

        }
        spyTitle += timestampStr;
      }

      if (psTitle) {
        if (spyTitle) {
          member.find(".member").after(`<div class="re_spy_col left"><i class="fas fa-info-circle re_spy_ps" style="margin-right: 3px;"></i><i class="fas fa-eye re_spy_spy"></i></div>`);
        } else {
          member.find(".member").after(`<div class="re_spy_col left"><i class="fas fa-info-circle re_spy_ps"></i></div>`)
        }
      } else {
        member.find(".member").after(`<div class="re_spy_col left" title="No data available.">N/A</div>`)
      }

      if (psTitle) {
        member.find(".re_spy_ps").attr("title", psTitle);
      }
      if (spyTitle) {
        member.find(".re_spy_spy").attr("title", spyTitle);
      }
    });
    return psList;
  })
  //insert information into header (buttons/text) and input functions
  .then((psList) => {
    let psStr = `<select class="mb1" id="re_ps_select"><option selected value="">Hide user if...</option>`;
    for (var i = 0; i < psList.length; i++) {
       psStr += `<option value="${psList[i]}">${psList[i]}</option>`;
    }
    psStr += `<option value="strength">Strength</option><option value="defense">Defense</option><option value="speed">Speed</option><option value="dexterity">Dexterity</option><option value="total">Total Stats</option></select>`;

    let enemyFac = $('.faction-names .name.enemy [class*="text"]').text();
    let friendlyFac = $('.faction-names .name.your [class*="text"]').text();


    $('#re_loader').remove();
    $('.re_content').prepend(`
      <div class="re_row">
      <div>
        ${psStr}
        <div class="switch_wrap switch_row" id="re_ps_wrap" style="display: none;">
          <select>
            <option value="" selected></option>
            <option value="<">Less than</option>
            <option value=">">Greater than</option>
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
      <div class="re_row">
        <div class="re_enemy_count">
          <p>Showing <span class="re_enemy">0</span> of <span class="re_enemy_max">0</span> ${enemyFac} members.</p>
        </div>
        <div class="re_your_count">
        <p>Showing <span class="re_your">0</span> of <span class="re_your_max">0</span> ${friendlyFac} members.</p>
      </div>
      </div>
      `);

      $('#re_ps_select').change(function() {
        if ($(this).val()) {
          $('#re_ps_wrap').show();
        } else {
          $('#re_ps_wrap').hide();
        }
      })

      $('#re_ps_wrap input').on('change, keyup', function() {
        var currentInput = $(this).val().toLowerCase();
        currentInput = currentInput.replace('k', '000');
        currentInput = currentInput.replace('m', '000000');
        currentInput = currentInput.replace('b', '000000000');
        currentInput = currentInput.replace('t', '000000000000');

        let fixedInput = currentInput.replace(/[A-Za-z!@#$%^&*(),]/g, '');

        if (fixedInput != '') {
          $(this).val(parseInt(fixedInput).toLocaleString("en-US"));
        } else {
          $(this).val('');
        }
      });

      $('#re_ps_wrap button').click(function() {
        let ps = $( "#re_ps_select" ).find(":selected").val();
        let inequalities = $('#re_ps_wrap select').val();
        let num = $('#re_ps_wrap input').val().replaceAll(",", "");

        if (ps && inequalities && num != undefined) {
          $('#re_ps_select').prop("selectedIndex", 0);
          $('#re_ps_wrap select').prop("selectedIndex", 0);
          $('#re_ps_wrap input').val("");
          $('#re_ps_wrap').hide();

          chrome.runtime.sendMessage({name: "set_value", value_name: "re_rankedwar", value: {filters: {[ps]: {"eq": inequalities, "value": num}}}}, (response) => {
            rankedWarFilters();
          });
        } else {
          if (!ps) {
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
            $('#re_ps_wrap input[type="number"]').addClass("error");
            setTimeout(function() {
              $('#re_ps_wrap input[type="number"]').removeClass("error");
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
    console.log(err);
    $('#re_message').html(`<span class="re_error">${err}</span>`);
    $('#re_message').show();
  });
}

function tornstatsSync(type, ID) {
  return new Promise((resolve, reject) => {
    if (tsData[type] != undefined) {
      return resolve(tsData[type]);
    }
    chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (res) => {
      if (res.status) {
        if (res.value.re_settings.tornstats != undefined && res.value.re_settings.tornstats == true) {
          if (type != undefined) {
            var selection = "";
            var version = "";

            switch (type) {
              case "roster":
                selection = "faction/roster";
                version = "v2";
              break;
              case "crimes":
                selection = "faction/crimes";
                version = "v2";
              break;
              case "rankedwar":
                if (ID != undefined) {
                  selection = "wars/"+ID;
                  version = "v2";
                } else {
                  reject("Ranked War ID was not provided.")
                }
              break;

              default:
                return reject("Request type ("+type+") not found.");
              break;
            }
            chrome.runtime.sendMessage({"name": "pull_tornstats", "selection": selection, "version": version}, (data) => {
              if (data) {
                if (data.status == true) {
                  //modify roster data to be 0 instead of N/A for easier totals and sorting
                  if (type == 'roster') {
                    Object.entries(data.members).forEach(([key, value]) => {
                      data.members[key]['userid'] = key;
                      if (value.total == "N/A") {
                        data.members[key]['total'] = 0;
                      }
                    });
                  }
                  console.log("Torn Stats Data", data);
                  tsData[type] = data;
                  return resolve(data);
                } else {
                  console.log("Torn Stats data status returned false.", data);
                  reject("Torn Stats data status returned false.")
                }
              } else {
                reject("Torn Stats data not found.");
              }
            });
          } else {
            reject("Request type not specified.")
          }
        } else {
          reject("Torn Stats integration disabled or invalid.");
        }
      } else {
        console.log("ReTorn Response:", res)
        reject(res.message);
      }
    });
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

    let fac_a;
    let fac_b;
    let facLinks = $('.f-war-list [class*="rankBox"] [class*="titleBlock"] [class*="nameWp"] a');
    if (facLinks.length == 2) {
      fac_a = $(facLinks[0]).attr("href").replace("/factions.php?step=profile&ID=", "")
      fac_b = $(facLinks[1]).attr("href").replace("/factions.php?step=profile&ID=", "")
    } else {
      return reject("Could not find faction IDs on page.")
    }
    chrome.runtime.sendMessage({name: "pull_api", selection: "rankedwars", type: "torn", id: ""}, (response) => {
      if (response && response.rankedwars) {
        for (const [warID, warData] of Object.entries(response.rankedwars)) {
          if (warData["factions"]) {
            if (warData["factions"][fac_a] && warData["factions"][fac_b]) {
              return resolve(warID);
            }
          }
        }
        return reject(`Could not find a ranked war for factions: ${fac_a} & ${fac_b}`)
      } else {
        return reject("Ranked War Data not found.")
      }
    });
  });
}

function rankedWarFilters() {
  chrome.runtime.sendMessage({name: "get_value", value: "re_rankedwar"}, (response) => {
    if (response && response.value && response.value.re_rankedwar && response.value.re_rankedwar.filters) {
      $('#re_filter_rules').empty();

        $('ul.members-list > li').each(function() {
          $(this).show();
          $(this).addClass("re_show");
          if (!$('#re_disable_filters input[type="checkbox"]').is(":checked")) { //if filter rules checkbox is not checked, proceed
            for (const [ps, data] of Object.entries(response.value.re_rankedwar.filters)) {
              if (data.eq == "<") {
                if ($(this).data(ps) != undefined) {
                  if ($(this).data(ps) < data.value) {
                    $(this).hide();
                    $(this).removeClass("re_show");
                  }
                }
              }
              if (data.eq == ">") {
                if ($(this).data(ps)  != undefined) {
                  if ($(this).data(ps) > data.value) {
                    $(this).hide();
                    $(this).removeClass("re_show");
                  }
                }
              }
            }
          }
        });

        let yourCount = $('ul.members-list > li.your.re_show').length;
        let enemyCount = $('ul.members-list > li.enemy.re_show').length;

        $('.re_enemy_count .re_enemy').text(enemyCount);
        $('.re_enemy_count .re_enemy_max').text($('ul.members-list > li.enemy').length);

        $('.re_your_count .re_your').text(yourCount);
        $('.re_your_count .re_your_max').text($('ul.members-list > li.your').length);



        for (const [ps, data] of Object.entries(response.value.re_rankedwar.filters)) {
          $('#re_filter_rules').prepend(`<li data-ps="${ps}"><div class="re_list_item x"><a class="remove-link"> <i class="delete-subscribed-icon"></i> </a></div><div class="re_list_item item">Hide user if ${ps} ${data.eq} ${parseInt(data.value).toLocaleString("en-US")}</div></li>`);
        }

        if (Object.keys(response.value.re_rankedwar.filters).length == 0) {
          $('#re_filter_rules').prepend(`<li><div class="re_list_item item">No filter rules being applied.</div></li>`);
        }
    }

    $('#re_filter_rules .re_list_item.x .remove-link .delete-subscribed-icon').off("click").click(function() {
      let parent = $(this).closest('li');
      let ps = parent.attr('data-ps');

      if (ps && parent.length > 0) {
        chrome.runtime.sendMessage({name: "del_value", value: "re_rankedwar", key: ps}, (response) => {
          if (response.status) {
            parent.remove();
            rankedWarFilters();
          }
        })
      }
    });
  });
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
})();
