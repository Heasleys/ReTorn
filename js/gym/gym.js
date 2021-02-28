// @version      1.0.0
// @description  Add TornStats Graph and send updated battle stats to Tornstats
// @author       Heasleys4hemp [1468764]
var APIKEY;
chrome.storage.sync.get(['re_api_key'], function(result) {
  if (result != undefined) {
    APIKEY = result.re_api_key;
    insertHeader();
    tornstatsSync();
  }
});


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

    <div class="re_content" hidden>
      <div class="re_row">

                <div id="stats" style="height: 250px; width: 100%;"></div>

      </div>
      <div class="re_row">
        <div class="re_button_wrap">
          <button class="re_torn_button" id="re_tornstats_stats">Submit changes to Torn Stats</button>
          <button class="re_torn_button" id="re_tornstats_hof" disabled>Enabled Tornstats HOF</button>
        </div>
      </div>
      <div class="re_row">
        <p id="re_message" hidden></p>
      </div>
    </div>
  </div>
  `);

  $(".re_head").click(function() {
      $(this).toggleClass("expanded");
      $("div.re_content").slideToggle("fast");

      $("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
  });

  $("button#re_tornstats_stats").click(function() {
    $.ajax({
      method: "GET",
      url: "https://beta.tornstats.com/api/v1/"+APIKEY+"/battlestats/record"
    })
    .done(function( data ) {
      if (data) {
        console.log(data);
        if (data.status == true) {
          $('#re_message').text(data.message);
          $('#re_message').attr('hidden', false);
        }
      }
    });
  });
}


function tornstatsSync() {
  $.ajax({
    method: "GET",
    url: "https://beta.tornstats.com/api/v1/" + APIKEY + "/battlestats/graph"
  })

  .done(function( data ) {
    if (data) {
      console.log(data);
      if (data.status == true) {
          insertGraph(data.data);
      }

      if (data.share_hof == 1) {

      } else {

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
        thousandsSep: ','
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
                showInLegend: false,
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


}
