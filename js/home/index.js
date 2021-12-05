
if ($('#body').attr('data-traveling') != "true" && $('#body').attr('data-abroad') != "true") {

  //Personal Perk total
  if ($('div#personal-perks').length != 0) {
    let totPP = $('div#personal-perks').find('ul > li.last').text().replace(/\D/g,'');
    $('h5.box-title:contains("Personal Perks")').text( 'Personal Perks: ' + totPP).prop('title', 'Total Personal Perks: ' + totPP);
  }

  //Live Networth
  if ($(".sortable-box .title h5.box-title:contains('General Information')").length != 0) {
    chrome.runtime.sendMessage({name: "get_value", value: "re_user_data", type: "local"}, (response) => {
      console.log(response);

      if (response && response.value && response.value.re_user_data) {
        data = response.value.re_user_data;
        if (data.networth && data.networth.total) {
          let liveNetworth = data.networth.total;
          let colorClass = "";

          let genBox = $("h5.box-title:contains('General Information')").parent('div.title').parent('div.sortable-box');
          let genUL = genBox.find("ul.info-cont-wrap");
          let oldNetworth = parseInt(genUL.find("li.last").attr("aria-label").replace("Networth: ", "").replaceAll(",",""));
          let diffNetworth = Math.round(liveNetworth - oldNetworth);

          if (diffNetworth < 0) {
            colorClass = " red";
          } else {
            colorClass = " green";
          }
          if (diffNetworth == 0) {
            colorClass = "";
          }

          genUL.append(`
            <li class="last" tabindex="0" role="row" aria-label="Networth: ${liveNetworth.toLocaleString("en-US")}">
              <span class="divider">
                <span>Live Networth</span>
              </span>
              <span class="desc${colorClass}">
                $${liveNetworth.toLocaleString("en-US")} <i class="networth-info-icon" title="Networth difference: <b class='${colorClass}'>$${diffNetworth.toLocaleString("en-US")}</b>"></i>
              </span>
            </li>
          `);
        }
      }
    });
  }

  //Effective BattleStats
  if ($('h5.box-title:contains("Battle Stats")').length != 0) {
    var bsBox = $('h5.box-title:contains("Battle Stats")').parent('div.title').parent('div.sortable-box');
    var statsContainer = bsBox.children('div.bottom-round');

    bsBox.find('div.battle.bottom-round').removeClass('bottom-round');
    var stats = [];
    var bonuses = [];
    var titles = [];

    bsBox.find('ul > li').each( function(i) {
      let stat = parseInt($(this).find('span.desc').text().replace(/\D/g,''));
      let perc = parseInt($(this).find('span.mod-value').text().replace("−", "-").replace("%", ""));
      let bonus = (stat * (perc / 100));
      let calced = stat + bonus;
      stats[i] = Math.floor(calced);
      bonuses[i] = Math.floor(bonus);
      if (bonus > 0) {
        titles[i] = "<div class='green'>+"+bonuses[i].toLocaleString()+"</div>";
      }
      if (bonus < 0) {
        titles[i] = "<div class='red'>"+bonuses[i].toLocaleString()+"</div>";
      }
      if (bonus == 0) {
        titles[i] = "<div>"+bonuses[i]+"</div>";
      }
    });
    stats[4] = Math.floor(stats[0] + stats[1] + stats[2] + stats[3]);
    bonuses[4] = Math.floor(bonuses[0] + bonuses[1] + bonuses[2] + bonuses[3]);
    if (bonuses[4] > 0) {
      titles[4] = "<div class='green'>+"+bonuses[4].toLocaleString()+"</div>";
    }
    if (bonuses[4] < 0) {
      titles[4] = "<div class='red'>"+bonuses[4].toLocaleString()+"</div>";
    }
    if (bonuses[4] == 0) {
      titles[4] = "<div>"+bonuses[4].toLocaleString()+"</div>";
    }
    console.log(stats);
    statsContainer.append(`
      <div class="re_head expanded flat-top">
        <span class="re_title"><span class="re_logo"><span class="re_yellow">Re</span>Torn: </span><span id="re_title">Effective Stats</span></span>
      </div>
      <div class="re_stats_list cont-gray bottom-round">

        <ul>
        <li tabindex="0" aria-label="Strength: `+stats[0].toLocaleString()+`">
          <span class="re_divider">
            <span>Strength</span>
          </span>
          <span class="stats" title="`+titles[0]+`">`+stats[0].toLocaleString()+`</span>
        </li>

        <li tabindex="0" role="row" aria-label="Defense: `+stats[1].toLocaleString()+`">
          <span class="re_divider">
            <span>Defense</span>
          </span>
          <span class="stats" title="`+titles[1]+`">`+stats[1].toLocaleString()+`</span>
        </li>

        <li tabindex="0" role="row" aria-label="Speed: `+stats[2].toLocaleString()+`">
          <span class="re_divider">
            <span>Speed</span>
          </span>
          <span class="stats" title="`+titles[2]+`">`+stats[2].toLocaleString()+`</span>
        </li>

        <li tabindex="0" role="row" aria-label="Dexterity: `+stats[3].toLocaleString()+`">
          <span class="re_divider">
          <span>Dexterity</span>
          </span>
          <span class="stats" title="`+titles[3]+`">`+stats[3].toLocaleString()+`</span>
        </li>

        <li class="last" tabindex="0" role="row" aria-label="Total: 4,205,666,307">
          <span class="re_divider">
          <span>Total</span>
          </span>
          <span class="stats" title="`+titles[4]+`">`+stats[4].toLocaleString()+`</span>
        </li>

        </ul>

      </div>
      `);
  }

}

//Max button abroad
if ($('#body').attr('data-abroad') == "true" && $('#body').attr('data-traveling') != "true") {
  addMaxButton();

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target && mutation.target.className && mutation.target.className.includes("msg") && $('#re_max').length == 0 && $('#re_trav_wrap').length == 0) {
        addMaxButton();
      }
    });
  });

  var target = document.querySelector('div.content-wrapper');
  observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});

  function addMaxButton() {
    $('.user-info .delimiter .msg').wrapInner("<span id='re_trav_wrap'>");
    $('.user-info .delimiter .msg').append(`<button class="re_torn_button" id="re_max" title="Fill Max Items">Max</button>`);
    $('.user-info .delimiter .msg').addClass("re_trav");

    $('#re_max').off("click").click(function() {
      var available = $('input.availableItemsAmount').val();
      var money = parseInt($('.delimiter > .msg').find('span.bold:contains("$")').text().replaceAll("$", "").replaceAll(",",""));

      $('.travel-agency-market ul.users-list > li').each(function() {
        let cost = parseInt($(this).find('.cost .c-price').text().replaceAll("$", "").replaceAll(",",""));
        let max = (money/cost) >= available ? available : Math.trunc((money/cost));

        $(this).find("input[name=amount]").val(max);
      })
    });
  }
}
