const target = document.querySelector('.content-wrapper');
const obsOptions = {attributes: false, childList: true, characterData: false, subtree:true};

//Hide level up banner
const level_up_observer = new MutationObserver(function(mutations, observer) {
  if (typeof features?.general?.hide_level_up?.enabled == "undefined") return;
  if (!features?.general?.hide_level_up?.enabled) {
    level_up_observer.disconnect();
    return;
  }
  if (features?.general?.hide_level_up?.enabled) {
    hide_level_up();
  }
});
level_up_observer.observe(document, obsOptions);

//effective stats
const effective_stats_observer = new MutationObserver(function(mutations, observer) {
  if (typeof features?.pages?.index?.effective_stats?.enabled == "undefined") return;
  if (!features?.pages?.index?.effective_stats?.enabled) {
    effective_stats_observer.disconnect();
    return;
  }
  if ($('#body').attr('data-traveling') == "true" || $('#body').attr('data-abroad') == "true") {
    effective_stats_observer.disconnect;
    return;
  }

  if ($('h5.box-title:contains("Battle Stats")').length) {
    insert_effective_stats();
    effective_stats_observer.disconnect();
  }
});
effective_stats_observer.observe(document, obsOptions);

//Live Networth
const live_networth_observer = new MutationObserver(function(mutations, observer) {
  if (typeof features?.pages?.index?.live_networth?.enabled == "undefined") return;
  if (!features?.pages?.index?.live_networth?.enabled) {
    live_networth_observer.disconnect();
    return;
  }
  if ($('#body').attr('data-traveling') == "true" || $('#body').attr('data-abroad') == "true") {
    live_networth_observer.disconnect();
    return;
  }
    
  if ($(".sortable-box .title h5.box-title:contains('General Information')").length) {
    insert_live_networth();
    live_networth_observer.disconnect();
  }
});
live_networth_observer.observe(document, obsOptions);

//Max button abroad
const max_abroad_observer = new MutationObserver(function(mutations, observer) {
  if (typeof features?.pages?.index?.max_buy_abroad?.enabled == "undefined") return;
  if (!features?.pages?.index?.max_buy_abroad?.enabled ) {
    max_abroad_observer.disconnect();
    return;
  }
  if ($('#body').attr('data-traveling') == "true" || $('#body').attr('data-abroad') == "false") {
    max_abroad_observer.disconnect();
    return;
  }

  mutations.forEach(function(mutation) {
    if (mutation.target && mutation.target.className && mutation.target.className.includes("msg") && $('#re_max').length == 0 && $('#re_trav_wrap').length == 0) {
      insert_max_abroad_button();
      max_abroad_observer.disconnect();
    }
  });
});
live_networth_observer.observe(document, obsOptions);

function insert_effective_stats() {
  if ($('#re_title:contains("Effective Stats")').length) return;

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
  statsContainer.append(`
    <div class="re_head expanded flat-top">
      <span class="re_title"><span id="re_title">Effective Stats</span></span>
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

function insert_live_networth() {
  if ($(".re_live_networth").length) return;

  sendMessage({name: "get_local", value: "re_user_data"})
  .then((r) => {

  if (r.status) {
    data = r.data;
    if (data.networth && data.networth.total) {
      const liveNetworth = data.networth.total;
      let colorClass = "";

      const genBox = $("h5.box-title:contains('General Information')").parent('div.title').parent('div.sortable-box');
      const genUL = genBox.find("ul.info-cont-wrap");
      const oldNetworth = parseInt(genUL.find("li.last").attr("aria-label").replace("Networth: ", "").replaceAll(",",""));
      const diffNetworth = Math.round(liveNetworth - oldNetworth);

      if (diffNetworth < 0) {
        colorClass = " red";
      } else {
        colorClass = " green";
      }
      if (diffNetworth == 0) {
        colorClass = "";
      }

      genUL.append(`
        <li class="last re_live_networth" tabindex="0" role="row" aria-label="Networth: ${liveNetworth.toLocaleString("en-US")}">
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

  })
  .catch((e) => console.error(e))
}

function insert_max_abroad_button() {
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

function hide_level_up() {
  const info_msg = $('.info-msg-cont');
  if (info_msg.length) {
    const msg = info_msg.find('.info-msg *:contains("Congratulations! You have enough experience to go up to level")');
    if (msg.length) {
      info_msg.hide();
      info_msg.next('hr.page-head-delimiter').hide();
      level_up_observer.disconnect();
    }

    const msg2 = info_msg.find('.info-msg *:contains("VKEY")');
    if (msg2.length) {
      info_msg.hide();
      info_msg.next('hr.page-head-delimiter').hide();
      level_up_observer.disconnect();
    }
  }
}