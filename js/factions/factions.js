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
  console.log(hash)
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

function crimesTab() {
  tornstatsSync("crimes")
  .then((data) => {
    console.log(data);
    //tsData["crimes"] = data;
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
        let facAvg = Math.trunc(facTotal/avgI).toLocaleString();
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

function rankedWar(warID) {
  //Insert Header
  insertHeader($("ul.f-war-list"), 'before');
  $('#re_title').text("Ranked War Filter");
  $('.re_content').html(`<img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" id="re_loader">
  <p id="re_message" style="display: none;"></p>`);
  getWarID()
  //pull ranked war data from Torn Stats
  .then((warID) => tornstatsSync("rankedwar", warID))
  //add data to members lists
  .then((data) => {
    console.log(data);
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
              psTitle += `<br><b>${index}: </b>${value.toLocaleString()}`;
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

      member.click(function(e) {e.preventDefault();console.log(member.data("Refills"))});
    });
    console.log(psList)
    return psList;
  })
  //insert information into header (buttons/text)
  .then((psList) => {
    console.log(psList);
    let psStr = `<select class="mb1" id="re_ps_select"><option selected value="">Personal Stats...</option>`;
    for (var i = 0; i < psList.length; i++) {
       psStr += `<option value="${psList[i]}">${psList[i]}</option>`;
    }
    psStr += `</select>`;

    $('#re_loader').remove();
    $('.re_content').prepend(`
      <div class="re_row">
      <div>
        ${psStr}
        <div class="switch_wrap switch_row" id="re_ps_wrap" style="display: none;">
          <select>
            <option selected></option>
            <option value="<">Less than</option>
            <option value=">">Greater than</option>
          </select>
          <input type="number" placeholder="value">
          <button class="re_torn_button" type="button">Add</button>
        </div>
      </div>
        <div style="display: none;">
          <label for="re_rw_xanax">Xanax Taken</label>
          <input type="range" min="0" max="10000" id="re_rw_xanax">
          <span id="re_rw_xanax_val">0</span>
        </div>
        <div class="switch_wrap mb4" id="re_rw_rules">
        <p class="re_ptitle">Filter Rules</p>
          <div class="re_scrollbox">
            <ul class="re_list" id="re_filter_rules">
            <li><div class="re_list_item item">No filter rules being applied.</div></li>
            </ul>
          </div>
        </div>
      </div>
      `);

      $('#re_rw_xanax').on('input', function() {
        let v = $(this).val();
        $('#re_rw_xanax_val').text(v.toLocaleString());
      });

      $('#re_rw_xanax').change(function() {
        let max = $(this).val();
        $('ul.members-list > li').each(function() {
          if ($(this).data("Xanax Taken") >= max) {
            $(this).hide();
          } else {
            $(this).show();
          }
        });
      });

      $('#re_ps_select').change(function() {
        if ($(this).val()) {
          $('#re_ps_wrap').show();
        } else {
          $('#re_ps_wrap').hide();
        }
      })

      $('#re_ps_wrap button').click(function() {
        alert($( "#re_ps_select" ).find(":selected").val());
        let ps = $( "#re_ps_select" ).find(":selected").val();
        let inequalities = $('#re_ps_wrap select').val();
        let num = $('#re_ps_wrap input[type="number"]').val();

        console.log(ps, inequalities, num);
        if (ps && inequalities && num != undefined) {
          $('#re_ps_select').prop("selectedIndex", 0);
          $('#re_ps_wrap select').prop("selectedIndex", 0);
          $('#re_ps_wrap input[type="number"]').val("");
          $('#re_ps_wrap').hide();
        }
      })
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
      console.log("Data already exists, no need to pull.")
      return resolve(tsData[type]);
    }
    chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (res) => {
      if (res.status) {
        if (res.value.re_settings.tornstats != undefined && res.value.re_settings.tornstats == true) {
          if (type != undefined) {
            var selection = "";

            switch (type) {
              case "roster":
                selection = "faction/roster";
              break;
              case "crimes":
                selection = "faction/crimes";
              break;
              case "rankedwar":
                if (ID != undefined) {
                  selection = "wars/"+ID;
                } else {
                  reject("Ranked War ID was not provided.")
                }
              break;

              default:
                return reject("Request type ("+type+") not found.");
              break;
            }
            chrome.runtime.sendMessage({"name": "pull_tornstats", "selection": selection}, (data) => {
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
                  console.log(data);
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
      console.log(response);
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

})();
