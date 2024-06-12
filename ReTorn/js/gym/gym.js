(function() {
  if ($('div.captcha').length == 0) {
    if (features?.pages?.gym?.faction_gym_gains?.enabled) {
      const observer = new MutationObserver(function(mutations) {
        if ($('ul[class*="properties_"]').length != 0 && $('.re_gym_gains').length == 0) {
          insertGymGains();
        }
      });
      observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
    }

    if (features?.pages?.gym?.torn_stats_graph?.enabled) {
      //Torn Stats Graph
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
      console.log(data);

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
})();
