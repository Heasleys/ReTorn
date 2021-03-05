chrome.runtime.onStartup.addListener(() => {
  checkLogin();
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log(details);
  if (details.reason != "install") {
    checkLogin();
  }
  if (details.reason == "install") {
    newInstall();
    checkLogin();
  }
});

chrome.management.onEnabled.addListener((extensionInfo) => {
  checkLogin();
});


chrome.alarms.onAlarm.addListener((alarm) => {
  console.log(alarm);

  if (alarm.name == "required_api") {
    getValue("re_api_key").then((response) => {
      pullRequiredAPI(response.re_api_key);
    })
    .catch((error) => {
      console.log(error);
      chrome.alarms.clear("required_api", (wasCleared) => {
        if (wasCleared == true) {
            console.log("API alarm removed");
        }
      });
    });
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

    if (notifId === 'new_message') {
        if (btnIdx === 0) {
            chrome.tabs.create({'url': 'https://www.torn.com/messages.php'});
        }
    }

    if (notifId === 'new_event') {
        if (btnIdx === 0) {
            chrome.tabs.create({'url': 'https://www.torn.com/events.php'});
        }
    }
});




function createAPIAlarm(minutes) {
  if (minutes == undefined) {
    minutes = 0.5;
  }
  chrome.alarms.get("required_api", (alarm) => {
    if (alarm == undefined) {
      console.log("Creating API alarm");
      chrome.alarms.create("required_api", {periodInMinutes: minutes});
    }
  });
}



function validateAPIKEY(apikey) {
  return new Promise((resolve, reject) => {
    fetchAPI(apikey, 'user', 'basic,timestamp&comment=ReTorn').then((response) => {
      setValue({"re_user": {"name": response.name, "player_id": response.player_id}}, "sync");
      pullRequiredAPI(apikey);
      createAPIAlarm();
      resolve();
    })
    .catch((error) => {
      reject(error);
    });
  });
}

function fetchAPI(apikey, type, selection, id) {
  return new Promise((resolve, reject) => {
    if (selection == undefined) {
      selection = "";
    }
    if (id == undefined) {
      id = "";
    }
    if (apikey == undefined || apikey.length > 16) {
      reject({status: false, message: "Invalid apikey."})
    }
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

function fetchTSAPI(apikey, selection) {
  return new Promise((resolve, reject) => {
    if (apikey == undefined || apikey.length > 16) {
      reject({status: false, message: "Invalid apikey."})
    }
    if (selection == undefined) {
      reject({status: false, message: "No selection given."});
    }

    fetch('https://beta.tornstats.com/api/v1/' + apikey + '/' + selection)

    .then((response) => {
      if (response.status !== 200) {
        console.log("There was a problem connecting to Torn Stats servers. Status Code: " + response.status);
        reject({status: false, message: "There was a problem connecting to Torn Stats servers. Status Code: " + response.status});
      } else {
        response.json().then((data) => {
          console.log(data);
          if (data.status == undefined) {
            reject({status: false, message: "No status detected from Torn Stats. Rejecting.", TSData: data});
          }

          if (data.status == false || data.status == "false") {
            reject(data);
          } else {
            resolve(data);
          }
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
      if (data.error.code == 2) { //key invalid
        //remove key, reset data
      }
      reject({status: false, message: "API Error: Code: " + data.error.code + " | Message: " + data.error.error});
    } else {
      resolve(data);
    }
  });
}

function pullRequiredAPI(apikey) {
  fetchAPI(apikey, 'user', 'bars,icons,money,notifications,cooldowns,travel,education,timestamp&comment=ReTorn').then((data) => {
    console.log(data);
    setValue({"re_user_data": data}, "local").then((res) => {
      console.log(res);
      chrome.runtime.sendMessage({name: "popup_data", data: data});
    })
    .catch((error) => {
      console.log(error);
    });
  })
  .catch((error) => {
    console.log(error);
  });
}



function checkLogin() {
  getValue("re_api_key", "sync").then((response) => {
    getValue("re_user", "sync").then((res) => {
      chrome.action.setPopup({popup: "pages/popup.html"});
      createAPIAlarm();
    })
    .catch((error) => {
      console.log(error);
    });
    pullRequiredAPI(response.re_api_key);
  })
  .catch((error) => {
    console.log(error);
  })
}

function integrateTornStats() {
  return new Promise((resolve, reject) => {
    getValue("re_api_key").then((response) => {
      fetchTSAPI(response.re_api_key, "").then((res) => {
        setValue({"re_settings": {"tornstats": true}}).then(() => {
          console.log(res);
          resolve(res);
        })
        .catch((error) => {
          reject(error);
        })
      })
      .catch((error) => {
        reject(error);
      })
    })
    .catch((error) => {
      console.log(error);
      reject(error);
    })
  });
}


function setValue(value, type) {
  var keys = Object.keys(value);
  return new Promise((resolve, reject) => {
    if (type == undefined) {
      type = "sync";
    }
    if (type == "sync") {
      chrome.storage.sync.get([keys[0]], (response) => {
        var merged = {};
        if (Object.keys(response).length != 0 && response.constructor === Object) {
          merged = merge(response, value);
        } else {
          merged = value;
        }
        console.log("Merged", merged);

        chrome.storage.sync.set(merged, () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            reject({status: false, message: chrome.runtime.lastError.message});
          } else {
            resolve({status: true, message: "Value: " + keys[0] + " has been set."});
          }
        });
      });
    }
    if (type == "local") {
      chrome.storage.local.set(value, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject({status: false, message: chrome.runtime.lastError.message});
        } else {
          resolve({status: true, message: "Value: " + keys[0] + " has been set."});
        }
      });
    }
  });
}

function getValue(value, type) {
  if (type == undefined) {
    type = "sync";
  }
  return new Promise((resolve, reject) => {
    if (type == "sync") {
      chrome.storage.sync.get([value], (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject({status: false, message: chrome.runtime.lastError.message});
        } else {
          if (Object.keys(response).length === 0 && response.constructor === Object) {
            reject({status: false, message: "Could not find value in storage.", value: value});
          }
          resolve(response);
        }
      });
    }
    if (type == "local") {
      chrome.storage.local.get([value], (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject({status: false, message: chrome.runtime.lastError.message});
        } else {
          if (Object.keys(response).length === 0 && response.constructor === Object) {
            reject({status: false, message: "Could not find value in storage.", value: value});
          }
          resolve(response);
        }
      });
    }
  });
}

function newInstall() {
  getValue("re_settings").then((response) => {

  })
  .catch((error) => {
    let startup_settings = {
      re_settings: {
        darkmode: false,
        tornstats: false,
        notifications: {
          enabled: true,
          energy: {
            enabled: true,
            value: "100%"
          },
          nerve: {
            enabled: true,
            value: "100%"
          },
          happy: {
            enabled: false,
            value: "100%"
          },
          life: {
            enabled: true,
            value: "<100%"
          },
          drugs: {
            enabled: true
          },
          boosters: {
            enabled: true
          },
          medical: {
            enabled: true
          },
          education: {
            enabled: true
          },
          messages: {
            enabled: true
          },
          events: {
            enabled: true
          }
        }
      }
    }

    setValue(startup_settings, "sync").then((res) => {}).catch((error) => {console.log(error);})
  })
}

function merge(a, b) {
    return Object.entries(b).reduce((o, [k, v]) => {
        o[k] = v && typeof v === 'object'
            ? merge(o[k] = o[k] || (Array.isArray(v) ? [] : {}), v)
            : v;
        return o;
    }, a);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(msg); //debugging


  switch (msg.name) {
    case "open_options":
      if (chrome.runtime.openOptionsPage) {
        console.log("Open Options Page");
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('/pages/options.html'));
      }
    break;


    case "set_api":
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
    break;


    case "get_value":
      if (msg.value != undefined) {
        getValue(msg.value, msg.type).then((response) => {
          console.log(response);
          sendResponse({status: true, value: response});
        })
        .catch((error) => {
          sendResponse(error);
        })
      }
      return true;
    break;


    case "set_value":
      if (msg.value_name != undefined && msg.value != undefined) {
        setValue({[msg.value_name]: msg.value}, msg.type).then((response) => {
          sendResponse(response);
        })
        .catch((error) => {
          sendResponse(error);
        });
      }
      return true;
    break;


    case "logout":
      sendResponse({status: false, message: "Sorry, can't logout yet."});
      return true;
    break;

    case "integrate_tornstats":
      integrateTornStats().then((response) => {
        sendResponse(response);
      })
      .catch((error) => {
        sendResponse(error);
      })
      return true;
    break;


    case "alarm_test":
      chrome.alarms.create("test", {delayInMinutes: 1.0});
    break;


    default:
    sendResponse({status: false, message: "Message received does not exist."});
    return true;
    break;
  }

});


chrome.storage.onChanged.addListener((changes, areaName) => {
  console.log({changes: changes, areaName: areaName});
  getValue("re_settings").then((response) => {
    var notifications = response.re_settings.notifications;
    if (changes.re_user_data != undefined && notifications != undefined && notifications.enabled == true) {
      let newValue = changes.re_user_data.newValue;
      let oldValue = changes.re_user_data.oldValue;
      if (newValue != undefined && oldValue != undefined) {

        // MESSAGES
        if (newValue.notifications.messages != oldValue.notifications.messages && newValue.notifications.messages != 0 && notifications.messages.enabled == true) {
          createNotification("new_message", "ReTorn: New Message", "You have " + newValue.notifications.messages + " new messages.", "", "View Messages", "https://www.torn.com/messages.php")
        }

        // EVENTS
        if (newValue.notifications.events != oldValue.notifications.events && newValue.notifications.events != 0 && notifications.events.enabled == true) {
          createNotification("new_event", "ReTorn: New Event", "You have " + newValue.notifications.events + " new events.", "", "View Events", "https://www.torn.com/events.php")
        }

        // COOLDOWNS - DRUGS
        if (oldValue.cooldowns.drug != 0 && newValue.cooldowns.drug == 0 && notifications.drugs.enabled == true) {
          createNotification("cooldown_drugs", "ReTorn: Drug Cooldown", "Your drug cooldown has expired.", "", "View Items", "https://www.torn.com/item.php#drugs-items")
        }

        // COOLDOWNS - BOOSTERS
        if (oldValue.cooldowns.booster != 0 && newValue.cooldowns.booster == 0 && notifications.boosters.enabled == true) {
          createNotification("cooldown_boosters", "ReTorn: Booster Cooldown", "Your booster cooldown has expired.", "", "View Items", "https://www.torn.com/item.phphttps://www.torn.com/item.php#boosters-items")
        }

        // COOLDOWNS - MEDICAL
        if (oldValue.cooldowns.medical != 0 && newValue.cooldowns.medical == 0 && notifications.medical.enabled == true) {
          createNotification("cooldown_medical", "ReTorn: Medical Cooldown", "Your medical cooldown has expired.", "", "View Items", "https://www.torn.com/item.php#medical-items")
        }

        // ENERGY
        if (notifications.energy.enabled == true && newValue.energy.current != oldValue.energy.current) {
          let notify = false;
          var message = "Your energy has reached it's value.";

            var value = notifications.energy.value;
            var num = parseFloat(value.replace(/\D/g, ""));
            let perc = Math.floor(parseFloat(num) * 100) / 100;
            let eperc = Math.floor((newValue.energy.current/newValue.energy.maximum) * 100);


            // LESS THAN
            if (value.includes("<")) {
              if (value.includes("%")) {
                if (eperc < perc) {
                  notify = true;
                  message = "Your energy is less than " + perc + "%.";
                }
              } else {
                if (newValue.energy.current < num) {
                  notify = true;
                  message = "Your energy is less than " + num + ".";
                }
              }
            }

            // GREATER THAN
            if (value.includes(">")) {
              if (value.includes("%")) {
                if (eperc > perc) {
                  notify = true;
                  message = "Your energy is greater than " + perc + "%.";
                }
              } else {
                if (newValue.energy.current > num) {
                  notify = true;
                  message = "Your energy is greater than " + num + ".";
                }
              }
            }

            // BASE VALUE
            if (!value.includes(">") && !value.includes("<")) {
              if (value.includes("%")) {
                if (eperc == perc) {
                  notify = true;
                  if (perc == 100) {
                    message = "Your energy is full.";
                  } else {
                    message = "Your energy has reached " + perc + "%.";
                  }
                }
              } else {
                if (newValue.energy.current == num) {
                  notify = true;
                  message = "Your energy has reached " + num + ".";
                }
              }
            }


            if (notify == true) {
              createNotification("energy", "ReTorn: Energy", message, "", "Visit Gym", "https://www.torn.com/gym.php")
            }
        }

      }
    }

  }).catch((error) => {console.log(error);});
});

function createNotificationLATER(name, title, message, contextMessage, buttonTitle) {
  var image = chrome.runtime.getURL('ReTorn.png');
  console.log(image);
  chrome.notifications.create(
      "test-notification",
      {
        type: "basic",
        iconUrl: image,
        title: "ReTorn: This is a notification",
        message: "hello there!"
      },
      function (id) {console.log(id)}
    );
  /*
  chrome.notifications.create(
      "new_event",
      {
        type: "basic",
        iconUrl: "ReTorn.png",
        title: title,
        message: message,
        contextMessage: contextMessage,
        buttons: [
          {
          title: buttonTitle
          }
        ]
      },
      function (id) {console.log(id)}
    );
    */
}

function createNotification(name, title, message, contextMessage, buttonTitle, openURL) {
  registration.showNotification(title, {
    body: message,
    data: name,
    icon: '/images/ReTorn@Default.png',
    badge: '/images/ReTorn@96px.png',
    message,
    actions: [
      { action: 'Open', title: buttonTitle},
      { action: 'Close', title: 'Close' }
    ]
  })
}

self.addEventListener('notificationclick', function (event) {
  if (event.action === 'Open') {
    chrome.tabs.create({'url': openURL});
  }
  event.notification.close()
});
