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
            console.log(re_npcs);

            if (re_npcs["data"][defenderID]) {
              const npc = re_npcs["data"][defenderID];

              var d = npc.loot_4 - ((Math.floor(Date.now() / 1000)));
              if (d < 0) {
                attack_time = "Now";
              } else {
                attack_time = new Date(d * 1000).toISOString().substr(11, 8);
              }

              let title = "<b>Loot Level 4 in:</b> " + attack_time;
              $('#playername_'+npc.name).attr("title", title);
              $('#playername_'+npc.name).text(npc.name + " ⏲");
              $('#playername_'+npc.name).css("cursor", "pointer");

              //$('div[id^="react-tooltip-Loot"]').find("[class*='tooltipText']")

              var t = 0;
              setInterval(function() {
                t++;
                let attack_time = "";
                if ((d-t) > 0) {
                  attack_time = new Date((d-t) * 1000).toISOString().substr(11, 8);
                } else {
                  attack_time = "Now";
                }
                let title = "<b>Loot Level 4 in:</b> " + attack_time;

                if ($('#playername_'+npc.name).attr('aria-describedby')) {
                  let aria = $('#playername_'+npc.name).attr('aria-describedby');

                  $('#'+aria + " > .ui-tooltip-content").html(title);
                } else {
                  $('#playername_'+npc.name).attr("title", title);
                }
                $('#playername_'+npc.name).text(npc.name + " ⏲");
                $('#playername_'+npc.name).css("cursor", "pointer");

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
