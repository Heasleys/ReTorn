// @version      1.0.0
// @description  Add TornStats Graph and send updated battle stats to Tornstats
// @author       Heasleys4hemp [1468764]

if ($('div.captcha').length == 0) {
  insertHeader($("div.content-wrapper"), 'append');
  $('#re_title').text("Torn Stats");
  $('.re_content').html(`
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
      loadTS();
    }
  });

  function loadTS() {
    chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (res) => {
      if (res.status != undefined) {
        if (res.value.re_settings.tornstats != undefined && res.value.re_settings.tornstats == true) {
          tornstatsSync();
        } else {

          $('div#graph').html(`<p>You do not currently have your <b><a href="https://www.tornstats.com/"  target="_blank">Torn Stats</a></b> account linked. Link your Torn Stats account in the ReTorn options.</p>`);

        }
      } else {
        errorMessage({status: false, message: "Unknown error."});
      }
    });
  }


  function tornstatsSync() {
    $('div#graph').html(`
      <div id="stats" style="height: 250px; width: 100%;"></div>
      `);

    $('div#buttons').html(`
      <div class="re_button_wrap">
        <button class="re_torn_button" id="re_tornstats_stats">Submit changes to Torn Stats</button>
        <button class="re_torn_button" id="re_tornstats_hof">Enable Tornstats HOF</button>
      </div>
      `);

      $('div#buttons').show();

    $("button#re_tornstats_stats").click(function() {
      chrome.runtime.sendMessage({name: "pull_tornstats", selection: "battlestats/record", version: "v2"}, (data) => {
        if (data) {
          if (data.status == true) {
            $('#re_message').text(data.message);
            $('#re_message').attr('hidden', false);
            $('#re_message').parent().attr('hidden', false);
          }
        }
      });
    });

    $("button#re_tornstats_hof").click(function() {
      let num = $(this).val();
      chrome.runtime.sendMessage({name: "pull_tornstats", selection: "hof/" + num, version: "v2"}, (data) => {
        if (data) {
          if (data.status == true) {
            $('#re_message').text(data.message);
            $('#re_message').attr('hidden', false);
            $('#re_message').parent().attr('hidden', false);
            if (num == 1) {
              $('#re_tornstats_hof').val(0);
              $('#re_tornstats_hof').html("DISABLE TORNSTATS HOF");
            } else {
              $('#re_tornstats_hof').val(1);
              $('#re_tornstats_hof').html("ENABLE TORNSTATS HOF");
            }
          }
        }
      });
    });

    //Load Torn Stats Battlestats graphs after header is opened
    chrome.runtime.sendMessage({name: "pull_tornstats", selection: "battlestats/graph", version: "v2"}, (data) => {
        if (data) {
          if (data.status == true) {
              insertGraph(data.data);
          }

          if (data.share_hof == 1) {
            $('#re_tornstats_hof').val(0);
            $('#re_tornstats_hof').html("DISABLE TORNSTATS HOF");
          } else {
            $('#re_tornstats_hof').val(1);
            $('#re_tornstats_hof').html("ENABLE TORNSTATS HOF");
          }
        }
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
};
