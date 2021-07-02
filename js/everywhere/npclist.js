(function() {
  var settings;


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
        if (settings && settings.tornstats != undefined && settings.tornstats == true && settings.npclist != undefined && settings.npclist == true) {
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
      // get apikey from ReTorn settings
      chrome.runtime.sendMessage({name: "get_value", value: "re_api_key"}, (response) => {
        if (response.status != undefined && response.status == true) {
            $.ajax({
              method: "GET",
              url: "https://www.tornstats.com/api/v1/"+response.value.re_api_key+"/loot"
            })
            .done(function( data ) {
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
      });
    }

  }


  //
  function setNPCs() {
    chrome.runtime.sendMessage({name: "get_value", value: "re_npcs", type: "local"}, (response) => {
      if (response.status == true) {
        if (response.value.re_npcs) {
          let re_npcs = response.value.re_npcs;
          if (re_npcs) {
            if (((Math.floor(Date.now() / 1000)) - re_npcs.timestamp) < (10*60)) { //only pull from tornstats if cached response is older than 10 minutes
              let npc_list = ``;
              let i = 0;
              Object.entries(re_npcs.data).forEach(([key, value]) => {
                i++;
                let attack_time;
                var d = value.loot_4 - ((Math.floor(Date.now() / 1000)));
                if (d < 0) {
                  attack_time = "Now";
                } else {
                  attack_time = new Date(d * 1000).toISOString().substr(11, 8);
                }
                npc_list += `
                <li id="`+value.torn_id+`">
                  <a href="/loader.php?sid=attack&user2ID=`+value.torn_id+`">`+value.name+`</a>
                  <span class="attack_time" title="Time until Loot Level 4">`+attack_time+`</span>
                </li>
                `;

                var t = 0;
                setInterval(function() {
                  t++;
                  let attack_time = "";
                  if ((d-t) > 0) {
                    attack_time = new Date((d-t) * 1000).toISOString().substr(11, 8);
                  } else {
                    attack_time = "Now";
                  }
                  if ((d-t) < (10*60) && !$('li#'+value.torn_id).hasClass('highlight')) {
                    $('li#'+value.torn_id).addClass('highlight');
                    $('.list_header').addClass('highlight');
                  }

                  $('li#'+value.torn_id+' span.attack_time').text(attack_time);
                }, 1000);
              });

              $('ul.npc_list').append(npc_list);
              $('div.re_npcButton > span.amount').text(i);
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

})();
