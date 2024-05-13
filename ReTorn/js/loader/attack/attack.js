const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const defenderID = urlParams.get('user2ID');
var t = 0; //time in seconds since interval started
var d = 0;

const observer = new MutationObserver(function(mutations) {
  if (document.getElementById('defender') || document.getElementById('attacker')) {
    insertNPCtimer();
    observer.disconnect();
  }
});
if (features?.pages?.attack?.npc_info?.enabled) {
  observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
}

function insertNPCtimer() {  
  getTornStats("loot", 0.08333)//get torn stats loot data, cache for 5 minutes
  .then((r) => {
    if (r?.status) {
      if (r[defenderID]) {
        const npc = r[defenderID]; //NPC api data

        const npcNameEl = $(`.user-name[id*="playername_${npc.name}"]`).closest(`div[class*="header_"]`);
        if (!npcNameEl.length) return;
        const insertElement = npcNameEl.parent(`[class*="headerWrapper_"]`).siblings(`[class*="playerArea_"]`).find(`[class*="playerWindow_"]`);
        insertElement.prepend(`<div class="re_lootwrap"><span id="re_loot_time"></span></div>`);


        change_loot_time(npc);
        setInterval(function() { change_loot_time(npc) }, 1000);
      }
    }
  })
  .catch((e) => {
      console.error(e);
  })
  }


function change_loot_time(npc) {
  t++; //increase interval time count by 1 second
  let attack_time, loot_time;
  if (settings?.npc_list[defenderID] && settings?.npc_list[defenderID].loot_time) {
    loot_time = settings?.npc_list[defenderID].loot_time;
  } else {
    loot_time = "loot_4";
  }
  let npc_time = npc[loot_time];

  if (!d) d = npc_time - ((Math.floor(Date.now() / 1000)));

  if ((d-t) > 0) {
    attack_time = new Date((d-t) * 1000).toISOString().substring(11, 19);
  } else {
    attack_time = "Now";
  }

  let title = `<b>${loot_time.replace("_", " ").replace("hosp out", "loot 1")}:</b> ${attack_time}`;


  //insert loot wrap
  if ($('#re_loot_time').length) {
    $('#re_loot_time').html(title);
  }

  //modify the loot tooltip to include timer
  if ($("div[id*='react-tooltip-Loot']").length != 0) {
    let tooltip = $("div[id*='react-tooltip-Loot']").find("[class*='tooltipText']");

    if ($('.re_tooltipDesc').length != 0) {
      $('.re_tooltipDesc').html(" - " + title);
    } else {
      let tooltipHTML = tooltip.find("span[class*='tooltipTitle']").html();
      tooltipHTML += "<span class='re_tooltipDesc'> - " + title + "</span>";
      tooltip.find("span[class*='tooltipTitle']").html(tooltipHTML);
    }
  }
}