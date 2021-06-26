(function() {

  const tsobserver = new MutationObserver(function(mutations) {
    if ($('#mainContainer').length != 0) {
      checkTornStatsCache();
      tsobserver.disconnect();
    }
  });

  tsobserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

  function checkTornStatsCache() {
    chrome.runtime.sendMessage({name: "get_value", value: "re_tornstats", type: "local"}, (response) => {
      if (response.status == true) {
        if (response.value.re_tornstats.events.timestamp != undefined) {
          if (((Math.floor(Date.now() / 1000)) - response.value.re_tornstats.events.timestamp) > (5*60)) { //only pull from tornstats if cached response is older than 5 minutes
            tornstatsSync();
          }
        }
      } else {
        tornstatsSync();
      }
    });
  }


  function tornstatsSync() {

    if (settings && settings.tornstats != undefined && settings.tornstats == true) {
      chrome.runtime.sendMessage({name: "get_value", value: "re_api_key"}, (response) => {
        if (response.status != undefined && response.status == true) {
            $.ajax({
              method: "GET",
              url: "https://www.tornstats.com/api/v1/"+response.value.re_api_key+"/events"
            })
            .done(function( data ) {
              if (data) {
                if (data.status == true) {
                  console.log(data);
                  var timestamp = Math.floor(Date.now() / 1000);
                  chrome.runtime.sendMessage({name: "set_value", value_name: "re_tornstats", value: {events: {timestamp: timestamp}}, type: "local"}, (response) => {

                   Object.entries(data.events).forEach(([key, value]) => {
                     if (value.seen == 0) {
                       var date = new Date(value.timestamp * 1000);
                       var hours = "0" + date.getHours();
                       var minutes = "0" + date.getMinutes();
                       var seconds = "0" + date.getSeconds();
                       var day = "0" + date.getDate();
                       var month = "0" + date.getMonth();
                       var year = date.getFullYear();
                       var formattedTime = hours.substr(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2) + " - " + day.substr(-2) + "/" + month.substr(-2) + "/" + year;
                       var day = date.toDateString();

                       var message = "<span class='datetime'>" + formattedTime + "</span> <a href='https://www.tornstats.com/' target='_blank'>" + value.event + "</a>";

                      insertAlertPopup("green", message);
                     }
                   });
                  });
                }
              }
            });
        }
      });
    }

  }

  function insertAlertPopup(style, message) {
    var popup = `<div class="alert_popup `+style+`" role="alert">`+message+`<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>`;
    $('#mainContainer').prepend(popup);
    $('.alert_popup button.close').click(function() {
      $(this).parent('.alert_popup').remove();
    });
  }


})();
