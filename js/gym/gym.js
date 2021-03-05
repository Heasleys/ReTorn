// @version      1.0.0
// @description  Add TornStats Graph and send updated battle stats to Tornstats
// @author       Heasleys4hemp [1468764]

if ($('div.captcha').length == 0) {
  insertHeader();

  function insertHeader() {
    $("div.content-wrapper").append(`
    <div class="re_container">
      <div class="re_head">
        <span class="re_title">ReTorn: Torn Stats</span>
          <div class="re_icon_wrap">
            <span class="re_icon arrow_right">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32"><path d=""></path></svg>
            </span>
          </div>
      </div>

      <div class="re_content" style="display: none;">
        <div class="re_row" id="graph">

                  <p>You do not currently have your <b><a href="https://www.tornstats.com/"  target="_blank">Torn Stats</a></b> account linked. Link your Torn Stats account on the options page under Extension Settings.</p>

        </div>
        <div class="re_row" id="buttons" style="display: none;">

        </div>
        <div class="re_row" hidden>
          <p id="re_message" hidden></p>
        </div>
      </div>
    </div>
    `);

    $(".re_head").click(function() {
        if ($('div#stats.loaded').length == 0) {
          loadTS();
        }
        $(this).toggleClass("expanded");
        $("div.re_content").slideToggle("fast");

        $("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
    });
  }

  function loadTS() {
    chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (res) => {
      if (res.status != undefined) {
        console.log(res);
        if (res.value.re_settings.tornstats != undefined && res.value.re_settings.tornstats == true) {
          chrome.runtime.sendMessage({name: "get_value", value: "re_api_key"}, (response) => {
            if (response.status != undefined) {
              if (response.status == true) {
                tornstatsSync(response.value.re_api_key);
              }
            } else {
              errorMessage({status: false, message: "Unknown error."});
            }
          });
        }
      } else {
        errorMessage({status: false, message: "Unknown error."});
      }
    });
  }


  function tornstatsSync(apikey) {
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
      $.ajax({
        method: "GET",
        url: "https://beta.tornstats.com/api/v1/"+apikey+"/battlestats/record"
      })
      .done(function( data ) {
        if (data) {
          console.log(data);
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
      $.ajax({
        method: "GET",
        url: "https://beta.tornstats.com/api/v1/"+apikey+"/hof/" + num
      })
      .done(function( data ) {
        if (data) {
          console.log(data);
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

    $.ajax({
      method: "GET",
      url: "https://beta.tornstats.com/api/v1/" + apikey + "/battlestats/graph"
    })

    .done(function( data ) {
      if (data) {
        console.log(data);
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
              backgroundColor: '#F2F2F2'
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
