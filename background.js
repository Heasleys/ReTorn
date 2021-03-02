chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(msg); //debugging
  if (msg.name == "open_options") {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('pages/options.html'));
    }
  }

  if (msg.name == "set_api") {
    if (msg.apikey != undefined) {
      validateAPIKEY(msg.apikey).then(() => {
        setValue({"re_api_key": msg.apikey}).then(() => {
          chrome.action.setPopup({popup: "pages/popup.html"});
          sendResponse({status: true, message: "Your apikey has been saved."});
        })
        .catch((error) => {
          sendResponse(error);
        });
      })
      .catch((error) => {
        sendResponse(error);
      });
    } else {
      sendResponse({status: false, message: "The apikey entered is invalid."});
    }
    return true;
  }

  if (msg.name == "get_value") {
    if (msg.value != undefined) {
      getValue(msg.value).then((response) => {
        console.log(response);
        sendResponse({status: true, value: response});
      })
      .catch((error) => {
        sendResponse(error);
      })
    }
    return true;
  }

  if (msg.name == "set_value") {
    if (msg.value_name != undefined && msg.value != undefined) {
      setValue({[msg.value_name]: msg.value}).then((response) => {
        sendResponse(response);
      })
      .catch((error) => {
        sendResponse(error);
      });
    }
    return true;
  }

  if (msg.name == "alarm_test") {
    createAPIAlarm();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log(alarm);
  if (alarm.name == "test") {
    chrome.notifications.create(
        "test-notification",
        {
          type: "basic",
          //iconUrl: "image.jpeg",
          title: "ReTorn: This is a notification",
          message: "hello there!",
          contextMessage: "Woah there...",
          buttons: [
            {
            title: "Test Button"
            },
            {
            title: "Epic Button"
            }]
        },
        function (id) {console.log(id)}
      );
  }

  if (alarm.name == "fuck") {

  }
});

chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
    if (notifId === 'test-notification') {
        if (btnIdx === 0) {
            chrome.tabs.create({'url': 'https://www.torn.com/'});
        } else if (btnIdx === 1) {
            chrome.tabs.create({'url': 'https://www.torn.com/profiles.php?XID=1468764'});
        }
    }
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Start up");
  checkLogin();
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log(details);
  if (details.reason == "update") {
    checkLogin();
  }
});


function createAPIAlarm() {
  chrome.alarms.create("test", {delayInMinutes: 1.0});
}


function fetchAPI(apikey, type, id, selection) {
  return new Promise((resolve, reject) => {

    fetch('https://api.torn.com/'+type+'/'+id+'?selections='+selection+'&key='+apikey+'&comment=ReTorn')

    .then((response) => {
      if (response.status !== 200) {
        console.log("There was a problem connecting to Torn servers. Status Code: " + response.status);
        reject({status: false, message: "There was a problem connecting to Torn servers. Status Code: " + response.status});
      } else {
        response.json().then((data) => {
          console.log(data);
          parseAPI(data).then((res) => {
            resolve(res);
          })
          .catch((error) => {
            reject(error);
          });
        })
        .catch((error) => {
          reject(error);
        });
      }
    })

    .catch((error) => {
      console.log('Fetch Error: ', error);
      reject({status: false, message: "Fetch Error: " + error});
    });

  });
}

function parseAPI(data) {
  return new Promise((resolve, reject) => {
    if (data.error != undefined) {
      reject({status: false, message: "API Error: Code: " + data.error.code + " | Message: " + data.error.error});
    } else {
      resolve(data);
    }
  });
}

function validateAPIKEY(apikey) {
  return new Promise((resolve, reject) => {
    fetchAPI(apikey, 'user', '', 'basic,timestamp').then((response) => {
      setValue({"re_user": {"name": response.name, "player_id": response.player_id}})
      resolve();
    })
    .catch((error) => {
      reject(error);
    });
  });
}

function checkLogin() {
  getValue("re_api_key").then((response) => {
    getValue("re_user").then((response) => {
      chrome.action.setPopup({popup: "pages/popup.html"});
    })
    .catch((error) => {
      console.log(error);
    })
  })
  .catch((error) => {
    console.log(error);
  })
}


function setValue(value) {
  var keys = Object.keys(value);
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(value, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        reject({status: false, message: chrome.runtime.lastError.message});
      } else {
        resolve({status: true, message: "Value: " + keys[0] + " has been set."});
      }
    });
  });
}

function getValue(value) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([value], (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        reject({status: false, message: chrome.runtime.lastError.message});
      } else {
        if (Object.keys(response).length === 0 && response.constructor === Object) {
          reject({status: false, message: "Could not find value in storage."});
        }
        resolve(response);
      }
    });
  });
}
