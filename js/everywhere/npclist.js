(function() {
  var intervals = [];
  var LOOT;
  const LOOT_TIMES = ["hosp_out", "loot_2", "loot_3", "loot_4", "loot_5"]
  const npc_list_base = `<div class="list_parent" id="nav-npcs">
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
</div>`;
const npc_list_mobile = `<li id="nav-npcs" class="">
<button type="button" class="top_header_button" aria-label="Open NPC List">
  <svg xmlns="http://www.w3.org/2000/svg" stroke="transparent" stroke-width="0" width="28" height="28" viewBox="-6 -4 28 28">
    <g>
      <path d="M13.88,13.06c-2.29-.53-4.43-1-3.39-2.94C13.63,4.18,11.32,1,8,1S2.36,4.3,5.51,10.12c1.07,2-1.15,2.43-3.39,2.94C.13,13.52,0,14.49,0,16.17V17H16v-.83C16,14.49,15.87,13.52,13.88,13.06Z"></path>
    </g>
  </svg>
  </button>
<div class="re-npclist-tooltip">
    <ul class="npc_list"></ul>
</div>
</li>`;

  const observerObserver = new MutationObserver(function(mutations) {
    if (getScreenType()) {
      const screenType = getScreenType();
      for (let i = 0; i < mutations.length; i++) {
        //mobile check
        if (mutations[i]?.target?.tagName == "BODY" && mutations[i]?.addedNodes?.length) {
          for (let a = 0; a < mutations[i].addedNodes.length; a++) {
            if (mutations[i].addedNodes[a].id == "header-root") {
              if (screenType == "mobile") {
                const target = document.getElementById('header-root');
                npcMobileObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
                observerObserver.disconnect();
              }
            }
          }
        }

        //desktop/tablet check
        if (mutations[i]?.target?.id == "mainContainer" && mutations[i]?.addedNodes?.length) {
          for (let a = 0; a < mutations[i].addedNodes.length; a++) {
            if (mutations[i].addedNodes[a].id == "sidebarroot") {
              if (screenType == "desktop" || screenType == "tablet") {
                const target = document.getElementById('sidebarroot');
                npcDesktopObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
                observerObserver.disconnect();
              }
            }
          }
        }

      }
    }
  });

  const npcMobileObserver = new MutationObserver(function(mutations) {
      if (document.querySelector('div.header-navigation.right > div.header-buttons-wrapper > ul.toolbar')) {
        if (!document.getElementById('nav-npcs')) {
          insertNPCList();
          npcMobileObserver.disconnect();
        }
      }
  });

  const npcDesktopObserver = new MutationObserver(function(mutations) {
    if (document.querySelector('#sidebar div:last-child div[class^="toggle-content"]')) {
      insertNPCList();
      npcDesktopObserver.disconnect();
    }
  });

  //observer document to start other observers
  observerObserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
  



  window.addEventListener('resize', event => {
    const screenType = getScreenType();
    //remove the top npc list if screen type is now desktop or tablet, then insert into sidebar
    if ($('li#nav-npcs').length && (screenType == "desktop" || screenType == "tablet")) {
      $('li#nav-npcs').remove();
    }
    
    if (!document.getElementById('nav-npcs')) {
      if (screenType == "desktop" || screenType == "tablet") {
        const target = document.getElementById('sidebarroot');
        npcDesktopObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
      }
      if (screenType == "mobile") {
        const target = document.getElementById('header-root');
        npcMobileObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
      }
    }
  });


  // function to insert NPC list
  function insertNPCList() {
    if (features?.sidebar?.npc_list?.enabled) {
      if (getScreenType() == "mobile") { //insert into small custom npc icon on topbar
        $('div.header-navigation.right > div.header-buttons-wrapper > ul.toolbar').prepend(npc_list_mobile);

          $('#nav-npcs > button.top_header_button').click(function() {
            $('#nav-npcs').toggleClass('active');
          })
      } 

      if (getScreenType() == "desktop" || getScreenType() == "tablet") { //insert underneath enemy/friends list
        // find enemy/friend/staff lists and insert NPCs list at bottom of list of lists
        $('h2[class^="header"]:contains("Lists")').siblings('div[class^="toggle-content"]').append(npc_list_base);

        // When NPC button is clicked, expand it for viewing
        $('.re_npcButton').click(function() {
          let expanded = !$('.npc_area').is(':visible');
          $('.npc_area').slideToggle("fast");
          $('.list_header').toggleClass('noshow');

          // Save that the NPC is either expanded or not in ReTorn settings
          const obj = {"headers": {"npc_list": {"expanded": expanded}}}
          sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
          .catch((e) => console.error(e))
        });

        // check settings to see if NPC lists was last expanded, if so, set list to expanded
        if (settings?.headers["npc_list"]?.expanded) {
          $('.npc_area').show();
          $('.list_header').removeClass('noshow');
        }

      }

      if (document.getElementById('nav-npcs')) {
        getTornStats("loot", 0.08333)//get torn stats loot data, cache for 5 minutes
        .then((r) => {
            LOOT = r;
            setNPCs();
        })
        .catch((e) => {
            console.error(e);
        })
      }
    }
  }

  //
  function setNPCs() {
    let npc_list = ``;
    let i = 0;
    Object.entries(LOOT).forEach(([key, value]) => {
      if (value?.torn_id != undefined) {
        npc_list += addNPC(value);
        i++;
      }
    });
    $('ul.npc_list').append(npc_list);
    $('div.re_npcButton > span.amount').text(i);
    setAttackTimeClick();
  }


  function addNPC(npc) {
    let attack_time;
    let loot_time;
    let npc_list;

    if (settings?.npc_list[npc.torn_id] && settings.npc_list[npc.torn_id].loot_time) {
      loot_time = settings?.npc_list[npc.torn_id].loot_time;
    } else {
      loot_time = "loot_4";
    }

    let npc_time = npc[loot_time];

    var d = npc_time - ((Math.floor(Date.now() / 1000)));
    if (d < 0) {
      attack_time = "now";
    } else {
      attack_time = new Date(d * 1000).toISOString().substring(11, 19);
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
        attack_time = new Date((d-t) * 1000).toISOString().substring(11, 19);
      } else {
        attack_time = "now";
      }
      if ((d-t) < (10*60) && !$('li#npc_'+npc.torn_id).hasClass('highlight')) {
        $('li#npc_'+npc.torn_id).addClass('highlight');
        $('#nav-npcs').addClass('highlight');
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
        const obj = {
          "npc_list": {
            [npc_id]: {
              "loot_time": loot_time
            }
          }
        }
        sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
        .then((r) => {
          if (r?.status) {
            //update global variable
            settings["npc_list"][npc_id] = {
              "loot_time": loot_time
            }
            let npc_li = addNPC(LOOT[npc_id]);
            $('#npc_'+npc_id).replaceWith(npc_li);
            setAttackTimeClick();
          }
        })
        .catch((e) => console.error(e))
      }

    });
  }
})();
