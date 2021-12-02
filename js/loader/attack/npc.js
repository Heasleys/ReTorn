if ($('div.captcha').length == 0) {

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const defenderID = urlParams.get('user2ID');

const observer = new MutationObserver(function(mutations) {
  if ($('#attacker').length != 0) {
    insertNPCtimer();
    observer.disconnect();
  }
});
observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

function insertNPCtimer() {
  chrome.runtime.sendMessage({name: "get_value", value: "re_npcs", type: "local"}, (response) => {
    if (response.status == true) {
      if (response.value.re_npcs) {
        let re_npcs = response.value.re_npcs;
          if (re_npcs) {
            let attack_time;
            let loot_time;

            if (re_npcs["data"][defenderID]) {
              const npc = re_npcs["data"][defenderID];
              if (settings.npclist[defenderID] && settings.npclist[defenderID].loot_time) {
                loot_time = settings.npclist[defenderID].loot_time;
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

              $('#playername_'+npc.name).wrap(`<span class="re_lootwrap">`);
              $('#playername_'+npc.name).after(`<span id="re_loot_time">${title}</span>`);

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
      }
    }
  });

  }

}
