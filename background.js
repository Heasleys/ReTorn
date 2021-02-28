//chrome.runtime.onInstalled.addListener(onInstalled);

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if (msg.name == "open_options") {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('pages/options.html'));
    }
  }

  if (msg.name == "alarm_test") {
    createAPIAlarm();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log(alarm);
});


//chrome.runtime.onStartup.addListener(() => {

//});

chrome.runtime.onInstalled.addListener((details) => {
  console.log(details);
  fetchAPI();
});


function createAPIAlarm() {
  chrome.alarms.create("test", {delayInMinutes: 1.0});
}


function fetchAPI() {
  chrome.storage.sync.get(['re_api_key'], function(result) {
    if (result.re_api_key != undefined) {
      fetch('https://api.torn.com/user/?selections=timestamp,basic,bars,icons,money,notifications,cooldowns,travel,education,messages,events&key='+result.re_api_key+'&comment=ReTorn')
      .then(
        function(response) {
          if (response.status !== 200) {
            console.log('Looks like there was a problem. Status Code: ' +
              response.status);
            return;
          }

          // Examine the text in the response
          response.json().then(function(data) {
            console.log(data);
            parseAPI(data);
          });
        }
      )
      .catch(function(err) {
        console.log('Fetch Error :-S', err);
      });
    }
  });
}

function parseAPI(data) {

}
