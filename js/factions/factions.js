// @version      1.0.0
// @description  Adds NNB from TornStats to crime list, adds TornStats roster in controls tab
// @author       Heasleys4hemp [1468764]
var url = location.hash;
var target = document.querySelector('.content-wrapper');
var obsOptions = {attributes: false, childList: true, characterData: false, subtree:true};
var tsData = {};

var observer = new MutationObserver(function(mutations, observer) {
  var hash = location.hash;

  if (hash.includes('tab=crimes') && $('.faction-crimes-wrap > .begin-wrap .crimes-list').length == 1) {
    if (tsData["crimes"] == undefined)  {
      tornstatsSync("crimes");
    } else {
      crimesTab();
    }
    observer.disconnect();
  }

  if (hash.includes('tab=controls') && $('ul.control-tabs').length == 1 && $('#tornstats-roster').length == 0) {
    if (tsData["roster"] == undefined)  {
      tornstatsSync("roster");
    } else {
      rosterTab();
    }

    observer.disconnect();
  }

});


if (url.includes('tab=crimes') || url.includes('tab=controls')) {
   observer.observe(target, obsOptions);
}
window.addEventListener('hashchange', hashHandler, false);


function hashHandler() {
  var hash = location.hash;
  if (hash.includes('tab=crimes') || hash.includes('tab=controls')) {
     observer.observe(target, obsOptions);
  }
}

function crimesTab() {

  if ($('.faction-crimes-wrap > .begin-wrap .crimes-list').length == 1 && tsData["crimes"]) {
      var crimeList = $('.faction-crimes-wrap > .begin-wrap .crimes-list');
      if (crimeList.attr('id') != 'ts') {
        crimeList.attr('id', 'ts');
        crimeList.find('li.item-wrap').each(function(index) {
          $(this).find('.plans-wrap ul.title > li.offences').after(`<li class="nnb" title="Natural Nerve Bar">NNB<div class="t-delimiter white"></div></li>`);
          $(this).find('.plans-wrap .viewport ul.plans-list>li').each(function() {
            let id = $(this).find('li.member > a').attr('href').replace(/\D/g, "");
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
              wrap = `<span title="Not in TornStats">--</span>`;
            }
            $(this).find('li.offences').after(`<li class="nnb"><span class="t-hide"></span>`+wrap+`</li>`);
          });
        });
      }
  }
}

function rosterTab() {

  if ($('ul.control-tabs.ui-tabs-nav').length == 1 && tsData["roster"]) {

    $('ul.control-tabs.ui-tabs-nav').append(`<li class="white-grad bold">TornStats:</li>`);
    $('ul.control-tabs.ui-tabs-nav').append(`
      <li data-disable="0" class="ui-state-default ui-corner-top" role="tab" tabindex="-1" aria-controls="tornstats-roster" aria-labelledby="ui-id-50" aria-selected="false">
        <a id="ts-roster" class="t-gray-3 ui-tabs-anchor" role="presentation" tabindex="-1" id="ui-id-50">
        TornStats Roster
        </a>
      </li>
      `);

    $('div.faction-controls-wrap').append(`<div id="tornstats-roster" class="tornstats-roster cont-gray control-tab-section ui-tabs-panel ui-widget-content ui-corner-bottom" aria-labelledby="ui-id-50" role="tabpanel" aria-expanded="false" aria-hidden="true" style="display: none;"></div>`);

    let roster_table = '<table><tr><th class="rank">Rank</th><th>Member</th><th>Total Stats</th><th>API Verified</th></tr>';
    let i = 1;

    const members = Object.values(tsData["roster"].members).sort((a, b) => a.total - b.total).reverse();

    Object.entries(members).forEach(([key, value]) => {
      let verified = value.verified == 1 ? "Yes" : "No";
      let total = value.total == 0 ? "Hidden" : value.total.toLocaleString();
      roster_table += `<tr><td class="rank">#`+i+`</td><td class="member"><a href="https://www.torn.com/profiles.php?XID=`+value.userid+`" target="_blank">`+value.name+` <span class='userid'>[`+value.userid+`]</span></a></td><td class="stats">`+total+`</td><td class="verified" data-verified="`+value.verified+`">`+verified+`</td></tr>`;
      i++;
    });
    roster_table += "</table>";

    $('#tornstats-roster').html(roster_table);
    $('td.verified[data-verified=0]').addClass('red');
    $('td.verified[data-verified=1]').addClass('green');

    $('#ts-roster').click(function() {
      $('div.control-tab-section').hide();
      $(this).data('last-tab', $('ul.control-tabs li.ui-state-default[tabindex=0]').children('a').attr('href'));
      $('li.ui-state-default[tabindex=0]').removeClass("ui-tabs-active ui-state-active").attr('tabindex', -1).attr('aria-selected', 'false');
      $('div.control-tab-section[aria-expanded="true"]').attr('aria-expanded', 'false').attr('aria-hidden', 'true');
      $('div#tornstats-roster').show();
    });

    $('ul.control-tabs > li > a:not("#ts-roster")').click(function() {
      $('div#tornstats-roster').hide();
      let last_tab = $('#ts-roster').data('last-tab');
      if ($(this).attr('href') == last_tab) {
        $(this).parent().addClass("ui-tabs-active ui-state-active").attr('tabindex', 0).attr('aria-selected', 'true');
        $(last_tab).show();
      }
    });
  }
}


function tornstatsSync(type) {
  chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (res) => {
    if (res.status != undefined) {
      if (res.value.re_settings.tornstats != undefined && res.value.re_settings.tornstats == true) {
        chrome.runtime.sendMessage({name: "get_value", value: "re_api_key"}, (response) => {
          if (response.status != undefined && response.status == true) {
              $.ajax({
                method: "GET",
                url: "https://beta.tornstats.com/api/v1/"+response.value.re_api_key+"/faction/"+type
              })
              .done(function( data ) {
                if (data) {
                  if (data.status == true) {
                    if (type == 'crimes') {
                      tsData[type] = data;
                      crimesTab();
                    }
                    if (type == 'roster') {
                      Object.entries(data.members).forEach(([key, value]) => {
                        data.members[key]['userid'] = key;
                        if (value.total == "N/A") {
                          data.members[key]['total'] = 0;
                        }
                      });

                      tsData[type] = data;
                      rosterTab();
                    }
                  }
                }
              });
          }
        });
      }
    }
  });
}
