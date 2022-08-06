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
    insertHeader($("div.content-wrapper"), 'append');
    $('#re_title').text("Torn Stats");
    $('.re_content').html(`
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
  
    $(".re_head").click(function() {
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
              $(this).find('[class*="propertyContent_"]').append(`<div class="re_gym_gains"><span>+${num}% faction gym gains</span></div>`)
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
  sendMessage({name: "get_torn_stats", selection: "battlestats/graph"})
  .then((data) => {
    console.log(data)
    if (data) {
      $('#re_loader').remove();
      if (data.status) {
        $('div#graph').html(`
        <div id="stats" style="height: 250px; width: 100%;"></div>
        `);
        insertTornStatsButtons();
        insertGraph(data.data);
        
        if (data.share_hof == 1) {
          $('#re_tornstats_hof').val(0);
          $('#re_tornstats_hof').html("DISABLE TORNSTATS HOF");
        } else {
          $('#re_tornstats_hof').val(1);
          $('#re_tornstats_hof').html("ENABLE TORNSTATS HOF");
        }
      } else {
        if (data.message.includes('re_torn_stats_apikey')) {
          $('div#graph').html(`<p>You do not currently have your <b><a href="https://www.tornstats.com/"  target="_blank">Torn Stats</a></b> account linked. <a id='re_options'>Click here</a> to view the ReTorn options.</p>`);
        } else {
          Message(data);
        }
      }
    }
  })
  .catch((e) => {
    $('#re_loader').remove();
    $('div#graph').html(`<p>You do not currently have your <b><a href="https://www.tornstats.com/"  target="_blank">Torn Stats</a></b> account linked. <a id='re_options'>Click here</a> to view the ReTorn options.</p>`);
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
    sendMessage({name: "get_torn_stats", selection: "battlestats/record"})
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
    sendMessage({name: "get_torn_stats", selection: "hof/" + num})
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
      }
    })
    .catch((e) => {
      Message(e);
    })
  });
}

function insertGraph(data) {
  let strength = `[`;
  let speed = `[`;
  let defense = `[`;
  let dexterity = `[`;
  let total = `[`;

  $.each(data,function(index, value){

    strength += `{"x": ` +value.timestamp * 1000+ `, "y": ` +value.strength+ `},`;
    speed += `{"x": ` +value.timestamp * 1000+ `, "y": ` +value.speed+ `},`;
    defense += `{"x": ` +value.timestamp * 1000+ `, "y": ` +value.defense+ `},`;
    dexterity += `{"x": ` +value.timestamp * 1000+ `, "y": ` +value.dexterity+ `},`;
    total += `{"x": ` +value.timestamp * 1000+ `, "y": ` +value.total+ `},`;

  });
  strength = strength.replace(/,\s*$/, "]");
  speed = speed.replace(/,\s*$/, "]");
  defense = defense.replace(/,\s*$/, "]");
  dexterity = dexterity.replace(/,\s*$/, "]");
  total = total.replace(/,\s*$/, "]");


  strength = JSON.parse(strength);
  speed = JSON.parse(speed);
  defense = JSON.parse(defense);
  dexterity = JSON.parse(dexterity);
  total = JSON.parse(total);




    Highcharts.theme = {
      "colors": ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477" ,"#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300"],
    };

    Highcharts.setOptions({
      lang: {
        decimalPoint: '.',
        thousandsSep: ',',
        numericSymbols: ['K', 'M', 'B', 'T']
      }
    });

    Highcharts.setOptions(Highcharts.theme);


    Highcharts.chart('stats', {
    title:{
      text:''
    },
    xAxis: {
          type: 'datetime',
          labels: {
            formatter: function() {
              return Highcharts.dateFormat("%d %b %Y", this.value);
            }
          },
    },
    yAxis: {
        title: {
            text: "Stats"
        }
    },
        chart: {
            backgroundColor: 'transparent'
        },
        series : [{
                name: 'Strength',
                type : 'line',
                color: '#3366cc',
                data : strength,
                showInNavigator: false,
            }, {
                name: 'Defense',
                type : 'line',
                color: '#dc3912',
                data: defense,
            }, {
                name: 'Speed',
                type : 'line',
                color: '#ff9900',
                data: speed,
            }, {
                name: 'Dexterity',
                type : 'line',
                color: '#109618',
                data: dexterity,
            }, {
                name: 'Total',
                type : 'line',
                color: '#990099',
                data: total,
                showInNavigator: true,
                showInLegend: true,
                navigatorOptions: {
                    visible: true,
                },
                visible: false,
            }
        ],
        legend: {
            enabled: true,
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },
        tooltip: {
      shared: true
    },
    credits: false
    });

    $('div#stats').addClass("loaded");
}


function Message(data) {
  $('#re_message').text(data.message);
  $('#re_message').attr('hidden', false);
  $('#re_message').parent().attr('hidden', false);
}
})();

