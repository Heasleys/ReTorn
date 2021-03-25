// @version      1.0.0
// @description  Add stat spies and profile info from torn stats to profile
// @author       Heasleys4hemp [1468764]

var observer = new MutationObserver(function(mutations) {
  if ($("div.profile-wrapper.medals-wrapper").length == 1 && $('div.re_container').length == 0) {
    loadTS();
    observer.disconnect();
  }
});

observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});


function insertHeader() {
  if ($('div.re_container').length == 0) {
    $("div.profile-wrapper.medals-wrapper").before(`
    <div class="re_container">
      <div class="re_head expanded">
        <span class="re_title">TornStats: Compare</span>
          <div class="re_icon_wrap">
            <span class="re_icon arrow_down">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32"><path d=""></path></svg>
            </span>
          </div>
      </div>

      <div class="re_content">
        <div class="re_row">

          <div id="re_spy"></div>

        </div>
      </div>
    </div>
    `);

    $(".re_head").click(function() {
        $(this).toggleClass("expanded");
        $("div.re_content").slideToggle("fast");
        $("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
    });
  }
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
          }
        });
      }
    }
  });
}

function tornstatsSync(apikey) {
  var uid = parseInt($('a[href*="/playerreport.php?step=add&userID="]').attr("href").replace(/\D/g, ""));
  if (uid) {
    insertHeader();
    $.ajax({
      method: "GET",
      url: "https://beta.tornstats.com/api/v1/"+apikey+"/spy/"+uid
    })
    .done(function( data ) {
      if (data) {
        console.log(data);
        if (data.status == true) {
          if (data.spy.status == true) {
            let spy_table = "<table><tr><th>Battle Stat</th><th>"+data.spy.player_name+"</th><th>You</th><th>Difference</th></tr>";
            spy_table += "<tr><td>Strength:</td><td>"+data.spy.strength.toLocaleString()+"</td><td>"+(data.spy.strength + data.spy.deltaStrength).toLocaleString()+"</td><td>"+data.spy.deltaStrength.toLocaleString()+"</td></tr>";
            spy_table += "<tr><td>Defense:</td><td>"+data.spy.defense.toLocaleString()+"</td><td>"+(data.spy.defense + data.spy.deltaDefense).toLocaleString()+"</td><td>"+data.spy.deltaDefense.toLocaleString()+"</td></tr>";
            spy_table += "<tr><td>Speed:</td><td>"+data.spy.speed.toLocaleString()+"</td><td>"+(data.spy.speed + data.spy.deltaSpeed).toLocaleString()+"</td><td>"+data.spy.deltaSpeed.toLocaleString()+"</td></tr>";
            spy_table += "<tr><td>Dexterity:</td><td>"+data.spy.dexterity.toLocaleString()+"</td><td>"+(data.spy.dexterity + data.spy.deltaDexterity).toLocaleString()+"</td><td>"+data.spy.deltaDexterity.toLocaleString()+"</td></tr>";
            spy_table += "<tr><td>Total:</td><td>"+data.spy.total.toLocaleString()+"</td><td>"+(data.spy.total + data.spy.deltaTotal).toLocaleString()+"</td><td>"+data.spy.deltaTotal.toLocaleString()+"</td></tr>";


            spy_table += "</table>";

            $('#re_spy').html(spy_table);
          }
        }
      }
    });
  }
}
