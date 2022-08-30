if ($('div.captcha').length == 0) {

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const defenderID = urlParams.get('user2ID');

const observer = new MutationObserver(function(mutations) {
  if (!document.getElementById('attacker')) {
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
        const npc = r[defenderID];
        let attack_time;
        let loot_time;

        if (settings?.npc_list[defenderID] && settings?.npc_list[defenderID].loot_time) {
          loot_time = settings?.npc_list[defenderID].loot_time;
        } else {
          loot_time = "loot_4";
        }
        let npc_time = npc[loot_time];

        var d = npc_time - ((Math.floor(Date.now() / 1000)));
        if (d < 0) {
          attack_time = "Now";
        } else {
          attack_time = new Date(d * 1000).toISOString().substr(11, 8);
        }

        let title = `<b>${loot_time.replace("_", " ").replace("hosp out", "loot 1")}:</b> ${attack_time}`;
        
        $("[id='playername_"+npc.name+"']").wrap(`<span class="re_lootwrap">`);
        $("[id='playername_"+npc.name+"']").after(`<span id="re_loot_time">${title}</span>`);

        var t = 0;
        setInterval(function() {
          t++;
          let attack_time = "";
          if ((d-t) > 0) {
            attack_time = new Date((d-t) * 1000).toISOString().substr(11, 8);
          } else {
            attack_time = "Now";
          }

          let title = `<b>${loot_time.replace("_", " ").replace("hosp out", "loot 1")}:</b> ${attack_time}`;

          if ($('.re_lootwrap').length > 0) {
            $('#re_loot_time').html(title);
          } else {
            $('#playername_'+npc.name).wrap(`<span class="re_lootwrap">`);
            $('#playername_'+npc.name).after(`<span id="re_loot_time">${title}</span>`);
          }

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


        }, 1000);
      }
    }
  })
  .catch((e) => {
      console.error(e);
  })
  }

}
