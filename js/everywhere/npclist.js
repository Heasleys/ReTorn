(function() {
  var settings;
  var intervals = [];
  var re_npcs;
  const LOOT_TIMES = ["hosp_out", "loot_2", "loot_3", "loot_4", "loot_5"]


  const observer = new MutationObserver(function(mutations) {
    if ($('h2[class^="header"]:contains("Lists")').siblings('div[class^="toggle-content"]').length != 0 && $('#nav-npcs').length == 0) {
      insertNPCList();
      observer.disconnect();
    }
  });

  // check ReTorn sync storage settings for Torn Stats integration and NPC list enabled
  chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (res) => {
    if (res.status && res.status == true) {
      if (res.value.re_settings) {
        settings = res.value.re_settings;
        if (settings && settings.tornstats != undefined && settings.tornstats == true && settings.npclist != undefined && settings.npclist.enabled == true) {
          //if npc list is enabled and tornstats integration is enabled, start observer
          observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
        }
      }
    }
  });


  // function to insert NPC list underneath enemy/friends list
  function insertNPCList() {
    // find enemy/friend/staff lists and insert NPCs list at bottom of list of lists
    $('h2[class^="header"]:contains("Lists")').siblings('div[class^="toggle-content"]').append(`
    <div class="list_parent" id="nav-npcs">
      <div class="list_header noshow">
        <a class="re_npcButton">
          <span class="svg">
            <svg xmlns="http://www.w3.org/2000/svg" stroke="transparent" stroke-width="0" width="20" height="16" viewBox="0 1 16 16">
              <g>
                <path d="M13.88,13.06c-2.29-.53-4.43-1-3.39-2.94C13.63,4.18,11.32,1,8,1S2.36,4.3,5.51,10.12c1.07,2-1.15,2.43-3.39,2.94C.13,13.52,0,14.49,0,16.17V17H16v-.83C16,14.49,15.87,13.52,13.88,13.06Z"></path>
              </g>
            </svg>
          </span>
          <span class="link_title">NPCs</span>
        </a>
        <div role="button" tabindex="0" class="button re_npcButton">
          <span class="amount">-</span>
          <span class="arrow"></span>
        </div>
      </div>

      <div class="npc_area" style="display: none;">
      <div class="npc_content">
        <ul class="npc_list"></ul>
      </div>
    </div>

    </div>
    `);

    // When NPC button is clicked, expand it for viewing
    $('.re_npcButton').click(function() {
      let expanded = !$('.npc_area').is(':visible');
      $('.npc_area').slideToggle("fast");
      $('.list_header').toggleClass('noshow');

      // Save that the NPC is either expanded or not in ReTorn settings
      chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {headers: {npclist: {expanded: expanded}}}});

    });

    // check settings to see if NPC lists was last expanded, if so, set list to expanded
    if (settings && settings.headers && settings.headers.npclist && settings.headers.npclist.expanded == true) {
      $('.npc_area').show();
      $('.list_header').toggleClass('noshow');
    }

    setNPCs();
  }


  function tornstatsSync() {
    //check ReTorn settings for Torn Stats integration, if so, continue
    if (settings && settings.tornstats != undefined && settings.tornstats == true) {
      chrome.runtime.sendMessage({name: "pull_tornstats", selection: "loot"}, (data) => {
        if (data) {
          if (data.status == true) {
            var timestamp = Math.floor(Date.now() / 1000);
            delete data.status;
            delete data.message;
            chrome.runtime.sendMessage({name: "set_value", value_name: "re_npcs", value: {timestamp: timestamp, data}, type: "local"}, (response) => {
              setNPCs();
            });
          }
        }
      });
    }
  }


  //
  function setNPCs() {
    chrome.runtime.sendMessage({name: "get_value", value: "re_npcs", type: "local"}, (response) => {
      if (response.status == true) {
        if (response.value.re_npcs) {
          re_npcs = response.value.re_npcs;
          if (re_npcs) {
            if (((Math.floor(Date.now() / 1000)) - re_npcs.timestamp) < (10*60)) { //only pull from tornstats if cached response is older than 10 minutes
              let npc_list = ``;
              let i = 0;
              Object.entries(re_npcs.data).forEach(([key, value]) => {
                npc_list += addNPC(value);
                i++;
              });
              $('ul.npc_list').append(npc_list);
              $('div.re_npcButton > span.amount').text(i);
              setAttackTimeClick();
            } else {
              tornstatsSync();
              return;
            }
          }
        }
      } else {
        tornstatsSync();
        return;
      }
    });
  }


  function addNPC(npc) {
    let attack_time;
    let loot_time;
    let npc_list;

    if (settings.npclist[npc.torn_id] && settings.npclist[npc.torn_id].loot_time) {
      loot_time = settings.npclist[npc.torn_id].loot_time;
    } else {
      loot_time = "loot_4";
    }

    let npc_time = npc[loot_time];

    var d = npc_time - ((Math.floor(Date.now() / 1000)));
    if (d < 0) {
      attack_time = "now";
    } else {
      attack_time = new Date(d * 1000).toISOString().substr(11, 8);
    }
    npc_list = `
    <li id="npc_`+npc.torn_id+`" data-tornid="`+npc.torn_id+`">
      <a href="/loader.php?sid=attack&user2ID=`+npc.torn_id+`">`+npc.name+`</a>
      <span class="attack_time" title="Time until `+loot_time.replace("_", " ")+`" data-loot_time="`+loot_time+`">`+loot_time.replace("_", " ").replace("hosp out", "loot 1") + ": " +attack_time+`</span>
    </li>
    `;

    if (intervals[npc.torn_id]) {
      clearInterval(intervals[npc.torn_id]);
    }

    var t = 0;
    intervals[npc.torn_id] = setInterval(function() {
      t++;
      let attack_time = "";
      if ((d-t) > 0) {
        attack_time = new Date((d-t) * 1000).toISOString().substr(11, 8);
      } else {
        attack_time = "now";
      }
      if ((d-t) < (10*60) && !$('li#npc_'+npc.torn_id).hasClass('highlight')) {
        $('li#npc_'+npc.torn_id).addClass('highlight');
        $('.list_header').addClass('highlight');
      }

      $('li#npc_'+npc.torn_id+' span.attack_time').text(loot_time.replace("_", " ").replace("hosp out", "loot 1") + ": " + attack_time);
    }, 1000);

    return npc_list;
  }


  //Set the click event functions for attack timer
  function setAttackTimeClick() {
    $('ul.npc_list .attack_time').off('click').click(function() {
      let loot_time;
      let cur_loot_time = $(this).data('loot_time');
      let npc_id = $(this).parent('li').data('tornid');
      //get index in loot_times array
      index = LOOT_TIMES.indexOf(cur_loot_time);
      //get the next loot_time in array, else get the first one (hosp_out)
      if(index >= 0 && index < LOOT_TIMES.length - 1) {
        loot_time = LOOT_TIMES[index + 1]
      } else {
        loot_time = LOOT_TIMES[0];
      }

      //set loot_time timer for specific npc
      if (npc_id && loot_time) {
        chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {npclist: {[npc_id]: {loot_time: loot_time}}}}, (response) => {
          if (re_npcs.data[npc_id]) {
            refreshSettings().then(() => {
              let npc_li = addNPC(re_npcs.data[npc_id]);
              $('#npc_'+npc_id).replaceWith(npc_li);
              setAttackTimeClick();
            });
          }
        });
      }

    });
  }

  function refreshSettings() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (res) => {
        if (res.status && res.status == true) {
          if (res.value.re_settings) {
            settings = res.value.re_settings;
            resolve();
          }
        }
      });
    });
  }
})();
