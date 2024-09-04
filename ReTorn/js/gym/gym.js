const gymObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      const addedNodes = [... mutation.addedNodes];
      if (addedNodes.some((node) => (typeof node.className === 'string' && node.className.includes('gymContentWrapper_')))) {
        startGymFeatures();
      }
    });
});

const gymStatBoxObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    const stat = $(mutation.target).find('h3[class*="title__"]').text().toLowerCase();
    if (settings?.gym?.disabled[stat] && !mutation.target.classList.contains("re_locked")) {
      mutation.target.classList.toggle('re_locked');
    }
  });
});

waitForElm('#gymroot').then((elm) => {
  startGymFeatures();
  gymObserver.observe(elm, OBS_OPTIONS);
});

function startGymFeatures() {
  waitForElm('#gymroot ul[class*="properties_"] > li').then((elm) => {
    if (features?.pages?.gym?.faction_gym_gains?.enabled && $('.re_gym_gains').length == 0) insertGymGains();
    if (features?.pages?.gym?.disable_stats?.enabled) {
      if ($('.re_lock_button').length == 0) {
        insertDisablers();
      }
      const parent = $(elm).parent('ul[class*="properties_"]')[0];
      gymStatBoxObserver.observe(parent, {attributes: true, attributeFilter: ["class"], childList: true, subtree:true});
    }
  });

  //Torn Stats Graph
  if (features?.pages?.gym?.torn_stats_graph?.enabled) {
    //Insert container
    if ($(`.re_container[data-feature="${TS_GRAPH}"]`).length != 0) return;
    const containerObject = {
        "feature": `${TS_GRAPH}`,
        "insertLocation": "append",
        "elementClasses": "",
        "bar": false
    }
    insertContainer($("div.content-wrapper"), containerObject);
    const RE_CONTAINER = $(`.re_container[data-feature="${TS_GRAPH}"]`);


    RE_CONTAINER.find('.re_content').html(`
      <div class="re_row" id="re_loader">
        <img src="/images/v2/main/ajax-loader.gif" class="ajax-placeholder m-top10 m-bottom10" style="margin-left: 0; left: 0;">
      </div>
      <div class="re_row" id="graph">
      </div>
      <div class="re_row" id="buttons" style="display: none;">
      </div>
      <div class="re_row" hidden>
        <p id="re_message" hidden></p>
      </div>
      `);
    if (settings?.headers?.gym?.torn_stats_graph?.expanded) {
      loadTornStatsGraph();
    }
    RE_CONTAINER.find(".re_head").click(function() {
      if ($('div#stats.loaded').length == 0) {
        loadTornStatsGraph();
      }
    });
  }
}

//Button events for disabling gyms
function insertDisablers() {
  let titles = $('[class*="gymContent_"] ul[class*="properties_"] li [class*="propertyTitle_"]');
  let span =  `<span class="re_lock_button"></span>`;

  titles.each(function() {
    $(this).before(span);
  });

  if (settings?.gym?.disabled) {
    for (const [stat, disabled] of Object.entries(settings?.gym?.disabled)) {
      if (disabled) {
        $(`[class*="gymContent_"] ul[class*="properties_"] li[class*="${stat}"]`).addClass('re_locked');
      }
    }
  }

  $('.re_lock_button').click(function() {
    const parent = $(this).parent();
    const disabled = !parent.hasClass('re_locked'); //reverse check, because of our observer, we want to change the class last

    const stat = parent.find('h3[class*="title__"]').text().toLowerCase();

    const obj = {
      "gym": {
        "disabled": {
          [stat]: disabled
        }
      }
    }
    sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
    .then((r) => {
      settings["gym"]["disabled"][stat] = disabled;
      parent.toggleClass('re_locked');
    })
    .catch((e) => console.error(e))
  });
}

//Faction Gym Gains on training area
function insertGymGains() {
  sendMessage({name: "get_local", value: "re_user_data"})
    .then((r) => {
      if (r?.data?.faction_perks.length) {
        $('[class*="gymContentWrapper_"]').find('ul[class*="properties_"] > li').each(function() {
          const stat = $(this).attr("class").split('_').shift().toLowerCase();
          for (const [key, value] of Object.entries(r?.data?.faction_perks)) {
            if (value.toLowerCase().includes(stat+ " gym gains")) {
              const num = value.replace(/\D/g, "");
              if ($(this).find('.re_gym_gains').length == 0) $(this).find('[class*="propertyContent_"]').append(`<div class="re_gym_gains"><span>+${num}% faction gym gains</span></div>`)
            }
          }
          //fill with empty space in case other stats have gym gains
          if ($(this).find('.re_gym_gains').length == 0) {
            $(this).find('[class*="propertyContent_"]').append(`<div class="re_gym_gains"><span>&nbsp;</span></div>`)
          }
        })
      }
    })
    .catch((e) => console.error(e));
}

//Load Torn Stats Battlestats graphs after header is opened
function loadTornStatsGraph() {
  getTornStats("battlestats/graph")
  .then((data) => { //error checks
    if (!data) throw `e`;
    if (!data.status) {
      if (data.message.includes('re_torn_stats_apikey')) {
        throw `e`;
      } else {
        Message(data);
        return;
      }
    }

    return data;
  })
  .then((data) => {
    $('#re_loader').remove();
    insertTornStatsButtons();

    if (data.share_hof == 1) {
      $('#re_tornstats_hof').val(0);
      $('#re_tornstats_hof').html("DISABLE TORNSTATS HOF");
    } else {
      $('#re_tornstats_hof').val(1);
      $('#re_tornstats_hof').html("ENABLE TORNSTATS HOF");
    }

    return data;
  })
  .then((data) => {
    $('div#graph').html(`
    <canvas id="stats" style="height: 250px; width: 100%;"></canvas>
    `);
    insertGraph(data.data);
  })
  .catch((e) => {
    console.log(e);
    $('#re_loader').remove();

    if (e != `e`) {
      $('div#graph').html(`<p>${e}</p>`);
    } else {
      $('div#graph').html(`<p>You do not currently have your <b><a href="https://www.tornstats.com/"  target="_blank">Torn Stats</a></b> account linked. <a id='re_options'>Click here</a> to view the ReTorn options.</p>`);
    }
  })
}

function insertTornStatsButtons() {
  $('div#buttons').html(`
  <div class="re_button_wrap">
    <button class="re_torn_button" id="re_tornstats_stats">Submit changes to Torn Stats</button>
    <button class="re_torn_button" id="re_tornstats_hof">Enable Tornstats HOF</button>
  </div>
  `);
  $('div#buttons').show();

  $("button#re_tornstats_stats").click(function() {
    sendMessage({name: "get_torn_stats", selection: "battlestats/record"})// Dont use getTornStats for this because this records new info, not pulls info
    .then((data) => {
      if (data.status) {
        Message(data);
      }
    })
    .catch((e) => {
      Message(e);
    });
  });

  $("button#re_tornstats_hof").click(function() {
    const num = $(this).val();
    sendMessage({name: "get_torn_stats", selection: "hof/" + num}) //dont use getTornStats because this toggles hof, not pulls info
    .then((data) => {
      if (data.status == true) {
        Message(data);
        if (num == 1) {
          $('#re_tornstats_hof').val(0);
          $('#re_tornstats_hof').html("DISABLE TORNSTATS HOF");
        } else {
          $('#re_tornstats_hof').val(1);
          $('#re_tornstats_hof').html("ENABLE TORNSTATS HOF");
        }

        const obj = {
          "battlestats_graph": {
            "share_hof": num
          }
        }
        sendMessage({"name": "merge_local", "key": "torn_stats", "object": obj})
        .catch((e) => console.error(e))
      }
    })
    .catch((e) => {
      Message(e);
    })
  });
}

function insertGraph(data) {
  const statsChart = document.getElementById('stats');
  let timestamps = Object.values(data).map(item => formatDate(new Date(item.timestamp * 1000)));
  let strengthValues = Object.values(data).map(item => item.strength);
  let defenseValues = Object.values(data).map(item => item.defense);
  let dexterityValues = Object.values(data).map(item => item.dexterity);
  let speedValues = Object.values(data).map(item => item.speed);
  let totalValues = Object.values(data).map(item => item.total);

  var style = getComputedStyle(document.body);
  var defaultColor = style.getPropertyValue('--default-color');

  Chart.defaults.borderColor = defaultColor;
  Chart.defaults.color = defaultColor;

  new Chart(statsChart, {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [
        {
          label: 'Strength',
          data: strengthValues,
          borderColor: '#3366cc',
          fill: false,
          pointStyle: "circle"
        }, 
        {
          label: 'Defense',
          data: defenseValues,
          borderColor: '#dc3912',
          fill: false,
          pointStyle: 'rectRot'
        },
        {
          label: 'Speed',
          data: speedValues,
          borderColor: '#ff9900',
          fill: false,
          pointStyle: "rectRounded"
        },
        {
          label: 'Dexterity',
          data: dexterityValues,
          borderColor: '#109618',
          fill: false,
          pointStyle: "triangle"
        },
        {
          label: 'Total',
          data: totalValues,
          borderColor: '#990099',
          fill: false,
          pointStyle: "star",
          hidden: true
        }
      ]
    },
    options: {
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 6
          }
        },
        y: {
          title: "Stats",
          grid: {
            display: false
          },
          ticks: {
            callback: function(value, index, ticks) {
              return abbreviateNumber(value);
            }
          }
        }
      },
      elements: {
        point:{
            radius: 0.5,
            hoverRadius: 6
        }
      },
      interaction: {
        intersect: false,
        mode: 'index',
      }
    }
  });

  $('div#stats').addClass("loaded");
}

function Message(data) {
  $('#re_message').text(data.message);
  $('#re_message').attr('hidden', false);
  $('#re_message').parent().attr('hidden', false);
}