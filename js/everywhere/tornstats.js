(function() {

  const tsobserver = new MutationObserver(function(mutations) {
    if ($('#mainContainer').length != 0) {
      if (settings && settings.tornstats != undefined && settings.tornstats == true) {
        checkTornStatsCache();
      }
      tsobserver.disconnect();
    }
  });

  tsobserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

  // Check ReTorn storage for most recently pulled Torn Stats event data
  function checkTornStatsCache() {
    chrome.runtime.sendMessage({name: "get_value", value: "re_tornstats", type: "local"}, (response) => {
      if (response.status == true) {
        if (response.value.re_tornstats.events.timestamp != undefined) {
          //only pull from tornstats if cached response is older than 5 minutes
          if (((Math.floor(Date.now() / 1000)) - response.value.re_tornstats.events.timestamp) > (5*60)) {
            tornstatsSync();
          }
        }
      } else {
        tornstatsSync();
      }
    });
  }


  // pull data from Torn Stats for Torn Stats events
  function tornstatsSync() {
    // Check ReTorn settings for if tornstats setting is enabled
    if (settings && settings.tornstats != undefined && settings.tornstats == true && settings.tsevents != undefined && settings.tsevents == true) {
      chrome.runtime.sendMessage({name: "pull_tornstats", selection: "events"}, (data) => {
        if (data) {
          if (data.status == true) {
            console.log(data);
            var timestamp = Math.floor(Date.now() / 1000); // Get the time right Now
            // Save Torn Stats event data to local storage, including current timestamp
            chrome.runtime.sendMessage({name: "set_value", value_name: "re_tornstats", value: {events: {timestamp: timestamp}}, type: "local"}, (response) => {

              // Loop through events for unseen events and format them into a more readable message
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

                 // Insert the Alert popup onto Torn page
                insertAlertPopup("green", message);
               }
             });
            });
          }
        }
      })
    }
  }

  // function to insert Alert popup to Torn page (css class, message)
  function insertAlertPopup(style, message) {
    var popup = `<div class="alert_popup `+style+`" role="alert">`+message+`<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>`;
    $('#mainContainer').prepend(popup);
    $('.alert_popup button.close').click(function() {
      $(this).parent('.alert_popup').remove();
    });
  }


})();
