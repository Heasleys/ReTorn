chrome.runtime.onStartup.addListener(() => {
  checkLogin();
});


chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason == "update") {
    checkUpdate();
    checkLogin();
  }
  if (details.reason == "install") {
    newInstall();
    checkLogin();
  }
});

// if extension was enabled, verify user is logged in
chrome.management.onEnabled.addListener((extensionInfo) => {
  checkLogin();
});

// Chrome Alarm for pulling API data every 30 seconds
chrome.alarms.onAlarm.addListener((alarm) => {
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
      checkLogin();
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
    if (apikey == undefined || apikey.length != 16) {
      reject({status: false, message: "Invalid apikey."})
    }
    fetch('https://api.torn.com/'+type+'/'+id+'?selections='+selection+'&key='+apikey+'&comment=ReTorn')

    .then((response) => {
      if (response.status !== 200) {
        console.log("There was a problem connecting to Torn servers. Status Code: " + response.status);
        reject({status: false, message: "There was a problem connecting to Torn servers. Status Code: " + response.status});
      } else {
        response.json().then((data) => {
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

// Function for fetching TornStats API data
function fetchTSAPI(apikey, selection) {
  return new Promise((resolve, reject) => {
    if (apikey == undefined || apikey.length > 16) {
      reject({status: false, message: "Invalid apikey."})
    }
    if (selection == undefined) {
      reject({status: false, message: "No selection given."});
    }

    fetch('https://www.tornstats.com/api/v1/' + apikey + '/' + selection)

    .then((response) => {
      if (response.status !== 200) {
        console.log("There was a problem connecting to Torn Stats servers. Status Code: " + response.status);
        reject({status: false, message: "There was a problem connecting to Torn Stats servers. Status Code: " + response.status});
      } else {
        response.json().then((data) => {
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
      logger("error", "api", "Error parsing api data. Torn API Error code detected.", {code: data.error.code, error: data.error.error, timestamp: Date.now()});
      if (data.error.code == 2 || data.error.code == 10 || data.error.code == 13) { //key invalid, key owner is in federal jail, or key owner is inactive, then remove apikey
        logout();
      }
      reject({status: false, message: "API Error: Code: " + data.error.code + " | Message: " + data.error.error});
    } else {
      resolve(data);
    }
  });
}

// Function for pulling the required API data
function pullRequiredAPI(apikey) {
  fetchAPI(apikey, 'user', 'bars,icons,money,notifications,cooldowns,travel,education,timestamp&comment=ReTorn').then((data) => {
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


// Check if user has logged in with their API key
function checkLogin() {
  getValue("re_api_key", "sync").then((response) => {
    getValue("re_user", "sync").then((res) => {
      chrome.action.setPopup({popup: "pages/popup.html"});
      chrome.action.setBadgeBackgroundColor({color: "#8ABEEF"});
      createAPIAlarm();
      getValue("re_user_data", "local").then((response) => {
        const data = response.re_user_data;
        if (data.notifications.events != undefined && data.notifications.messages != undefined) {
          if ((data.notifications.events + data.notifications.messages) > 0) {
            let badgeNum = parseInt(data.notifications.events + data.notifications.messages).toString();
            chrome.action.setBadgeText({text: badgeNum});
          } else {
            chrome.action.setBadgeText({text: ""});
          }
        }
      });
    })
    .catch((error) => {
      console.log(error);
    });
    pullRequiredAPI(response.re_api_key);
  })
  .catch((error) => {
    console.log(error);
  });

  getValue("re_item_data", "local").then((res) => {
    if ((Math.floor(Date.now() / 1000) - parseInt(res.re_item_data.timestamp)) > 86400) { //has items been updated in 1 day?
      getItemsAPI();
    }
  })
  .catch((error) => {
    console.log(error);
    getItemsAPI();
  });
}

function logout() {
  removeValue("re_api_key", "sync")
  removeValue("re_user", "sync")
  removeValue("re_user_data", "local")
  setValue({['re_settings']: {"tornstats": false}}, "sync")
  .catch((error) => {
    console.log({status: false, message: "Failed to delete apikey.", error: error});
    sendResponse({status: false, message: "Failed to delete apikey.", error: error});
  });
}

// Function for updating ReTorn settings in case user has older extension version
function checkUpdate() {
  getValue("re_settings", "sync").then((response) => {
    console.log("ReTorn: Checking for updates in settings...", response);
    const settings = response.re_settings;

    //update counter
    let i = 0;
    let update_settings = {re_settings: {}}

    //checking npclist
    if (settings.npclist == undefined) {
      console.log("ReTorn: Update found. Adding NPC List update.");
      update_settings.re_settings.npclist = {enabled: false};
      i++;
    }
    //if old npclist settings exist (v0.0.4), fix with new version (v0.0.5)
    if (settings.npclist == false) {
      delete settings.npclist;
      update_settings.re_settings.npclist = {enabled: false};
      i++;
    }
    //if old npclist settings exist (v0.0.4), fix with new version (v0.0.5)
    if (settings.npclist == true) {
      delete settings.npclist;
      update_settings.re_settings.npclist = {enabled: true};
      i++;
    }

    //checking npclist
    if (settings.tsevents == undefined) {
      console.log("ReTorn: Update found. Adding tsevents update.");
      update_settings.re_settings.tsevents = false;
      i++;
    }

    //checking chat user highlights
    if (settings.chatuserhighlight == undefined) {
      console.log("ReTorn: Update found. Adding Chat User Highlight update.");
      update_settings.re_settings.chatuserhighlight = false;
      i++;
    }

    //checking left align
    if (settings.leftalign == undefined) {
      console.log("ReTorn: Update found. Adding Left Align update.");
      update_settings.re_settings.leftalign = false;
      i++;
    }

    //checking torn3d
    if (settings.torn3d == undefined) {
      console.log("ReTorn: Update found. Torn 3D");
      update_settings.re_settings.torn3d = false;
      i++;
    }

    //checking travel notifications
    if (settings.notifications.travel == undefined) {
      console.log("ReTorn: Update found. Adding Travel Notification update.");
      update_settings.re_settings.notifications = {travel: {enabled: true}};
      i++;
    }


    console.log(update_settings);
    if (i > 0) {
      console.log("ReTorn: Applying updates...");
      setValue(update_settings, "sync").catch((error) => {console.log(error);});
    }
  })
  .catch((error) => {
    console.log(error);
  });

  getValue("re_chatuserhighlight", "sync").then((response) => {
    console.log("ReTorn: Checking for updates - Chat User Highlights data found. No update needed.", response);
  })
  .catch((error) => {
    console.log("ReTorn: Update found for Chat User Highlights. Adding Chat User Highlights data.", error);
    setValue({"re_chatuserhighlight": {}}, "sync").catch((error) => {console.log(error);});
  });

  getValue("re_logs", "local").then((response) => {
    console.log("ReTorn: Checking for updates - Log Data found. No update needed.", response);
  })
  .catch((error) => {
    console.log("ReTorn: Update found for Logs. Adding Logs data.", error);
    let re_logs = { re_logs: { error: { api: { }, page: { }, notification: { }, settings: { }, background: { } }, update: { changed: { }, deleted: { }, new: { } }, api: { } } }
    setValue(re_logs, "local").catch((error) => {console.log(error);});
  });
}

// Function for integrating Torn Stats features into ReTorn
function integrateTornStats() {
  return new Promise((resolve, reject) => {
    getValue("re_api_key").then((response) => {
      fetchTSAPI(response.re_api_key, "").then((res) => {
        setValue({"re_settings": {"tornstats": true}}).then(() => {
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

// function for saving data to storage locations
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

// function for pulling data from storage locations
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

// function for deleting nested values from storage (NOT fulling deleting values)
function delValue(value, key, type) {
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
          console.log("Delete Value: ", value);
          console.log(response);

          // Deleting Quick Crime Storage
          if (value == "re_qcrimes") {
            var order = response.re_qcrimes.crimes[key].order;
            delete response.re_qcrimes.crimes[key];
            Object.keys(response.re_qcrimes.crimes).forEach(function(k) {
              if (response.re_qcrimes.crimes[k].order > order) {
                response.re_qcrimes.crimes[k].order--;
              }
            });
          }

          // Deleting Chat Highlight Storage
          if (value == "re_chatuserhighlight") {
            delete response.re_chatuserhighlight[key];
          }

          // Deleting Quick Items Storage
          if (value == "re_qitems") {
            var order = response.re_qitems.items[key].order;
            delete response.re_qitems.items[key];
            Object.keys(response.re_qitems.items).forEach(function(k) {
              if (response.re_qitems.items[k].order > order) {
                response.re_qitems.items[k].order--;
              }
            });
          }

          chrome.storage.sync.set(response, () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
              reject({status: false, message: chrome.runtime.lastError.message});
            } else {
              resolve({status: true, message: "Value: " + key + " has been deleted."});
            }
          });
        }
      });
    }

  });
}

// Function for removing values from storage (complete destruction of value)
function removeValue(value, type) {
  return new Promise((resolve, reject) => {

    if (type == "sync") {
      chrome.storage.sync.remove(value, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject({status: false, message: chrome.runtime.lastError.message});
        } else {
          resolve({status: true, message: "Sync Value: " + value + " has been removed."});
        }
      });
    }

    if (type == "local") {
      chrome.storage.local.remove(value, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject({status: false, message: chrome.runtime.lastError.message});
        } else {
          resolve({status: true, message: "Local Value: " + value + " has been removed."});
        }
      });
    }

  });
}

// New Installation function for setting default settings
function newInstall() {
  getValue("re_settings").then((response) => {

  })
  .catch((error) => {
    let startup_settings = {
      re_settings: {
        darkmode: false,
        tornstats: false,
        npclist: {
          enabled: false
        },
        tsevents: false,
        chatuserhighlight: false,
        leftalign: false,
        torn3d: false,
        header_color: "#e0ce00",
        notifications: {
          notifications: {
            enabled: true
          },
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
            enabled: false,
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
            enabled: false
          },
          messages: {
            enabled: true
          },
          events: {
            enabled: true
          },
          travel: {
            enabled: true
          }
        },
        events: {
          eastereggs: {
            enabled: false
          }
        }
      },
      re_chatuserhighlight: {

      }
    }

    let re_logs = {
      re_logs: {
        error: {
          api: {

          },
          page: {

          },
          notification: {

          },
          settings: {

          },
          background: {

          }
        },
        update: {
          changed: {

          },
          deleted: {

          },
          new: {

          }
        },
        api: {
        }
      }
    }

    setValue(startup_settings, "sync").then((res) => {}).catch((error) => {console.log(error);})
    setValue(re_logs, "local").then((res) => {}).catch((error) => {console.log(error);})
  })
}

// Function for merging two sets of nested objects
function merge(a, b) {
    return Object.entries(b).reduce((o, [k, v]) => {
        o[k] = v && typeof v === 'object'
            ? merge(o[k] = o[k] || (Array.isArray(v) ? [] : {}), v)
            : v;
        return o;
    }, a);
}

// Function for getting all Torn Item data and saving it to local storage
function getItemsAPI() {
  getValue("re_api_key").then((response) => {
    fetchAPI(response.re_api_key, 'torn', 'items,timestamp&comment=ReTorn').then((data) => { //API key is available, so get a fresh new list of Torn items from the API
      setValue({"re_item_data": data}, "local");
    });
  })
  .catch((error) => {
    const url = chrome.runtime.getURL('/files/items.json'); //API key hasn't been set yet, so get old list of Torn items from file
    fetch(url).then((response) => response.json()).then((json) => setValue({"re_item_data": json}, "local"));
  });
}

// Listen for sent browser messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

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
            checkLogin();
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
          sendResponse({status: true, value: response});
        })
        .catch((error) => {
          sendResponse(error);
        })
      }
      return true;
    break;

    case "del_value":
      if (msg.value != undefined && msg.key != undefined) {
        delValue(msg.value, msg.key, msg.type).then((response) => {
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
      logout();
      sendResponse({status: true, value: "Logout success."});
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

    case "pull_tornstats":
      console.log("PULL TORNSTATS", msg);
      if (msg.selection != undefined) {
        getValue("re_api_key").then((response) => {
          fetchTSAPI(response.re_api_key, msg.selection).then((res) => {
            logger("api", "tornstats", "Torn Stats API", {status: res.status, message: res.message, selection: msg.selection, timestamp: Date.now()});
            sendResponse(res);
          })
        }).catch((error) => {
          reject(error);
        })

      }

      return true;
    break;

    default:
    sendResponse({status: false, message: "Message received does not exist."});
    return true;
    break;
  }

});

// On changes to Storage, check for differences in data for notifications
chrome.storage.onChanged.addListener((changes, areaName) => {
  console.log({changes: changes, areaName: areaName});
  if (changes.re_user_data != undefined) {
    getValue("re_settings").then((response) => {
      var notifications = response.re_settings.notifications;
      if (notifications != undefined && notifications.notifications.enabled == true) {
        let newValue = changes.re_user_data.newValue;
        let oldValue = changes.re_user_data.oldValue;
        if (newValue != undefined && oldValue != undefined) {

          if ((newValue.notifications.events + newValue.notifications.messages) > 0) {
            let badgeNum = parseInt(newValue.notifications.events + newValue.notifications.messages).toString();
            chrome.action.setBadgeBackgroundColor({color: "#8ABEEF"});
            chrome.action.setBadgeText({text: badgeNum});
          } else {
            chrome.action.setBadgeText({text: ""});
          }

          // MESSAGES
          if (notifications.messages.enabled == true && newValue.notifications.messages != oldValue.notifications.messages && newValue.notifications.messages != 0) {
            createNotification("new_message", "ReTorn: New Message", "You have " + newValue.notifications.messages + " new messages.", {action: 'Open', title: "View Messages"}, "https://www.torn.com/messages.php");
          }

          // EVENTS
          if (notifications.events.enabled == true && newValue.notifications.events != oldValue.notifications.events && newValue.notifications.events != 0) {
            createNotification("new_event", "ReTorn: New Event", "You have " + newValue.notifications.events + " new events.", {action: 'Open', title: "View Events"}, "https://www.torn.com/events.php");
          }

          // COOLDOWNS - DRUGS
          if (notifications.drugs.enabled == true && oldValue.cooldowns.drug != 0 && newValue.cooldowns.drug == 0) {
            createNotification("cooldown_drugs", "ReTorn: Drug Cooldown", "Your drug cooldown has expired.", {action: 'Open', title: "View Items"}, "https://www.torn.com/item.php#drugs-items");
          }

          // COOLDOWNS - BOOSTERS
          if (notifications.boosters.enabled == true && oldValue.cooldowns.booster != 0 && newValue.cooldowns.booster == 0) {
            createNotification("cooldown_boosters", "ReTorn: Booster Cooldown", "Your booster cooldown has expired.", {action: 'Open', title: "View Items"}, "https://www.torn.com/item.php#boosters-items");
          }

          // COOLDOWNS - MEDICAL
          if (notifications.medical.enabled == true && oldValue.cooldowns.medical != 0 && newValue.cooldowns.medical == 0) {
            createNotification("cooldown_medical", "ReTorn: Medical Cooldown", "Your medical cooldown has expired.", {action: 'Open', title: "View Items"}, "https://www.torn.com/item.php#medical-items");
          }

          // ENERGY
          if (notifications.energy.enabled == true && newValue.energy.current != oldValue.energy.current) {
            let data = checkNotifyBars('energy', notifications, newValue, oldValue);
            if (data.notify == true) {
              createNotification("energy", "ReTorn: Energy", data.message, {action: 'Open', title: "Visit Gym"}, "https://www.torn.com/gym.php");
            }
          }

          // NERVE
          if (notifications.nerve.enabled == true && newValue.nerve.current != oldValue.nerve.current) {
            let data = checkNotifyBars('nerve', notifications, newValue, oldValue);
            if (data.notify == true) {
              createNotification("nerve", "ReTorn: Nerve", data.message, {action: 'Open', title: "Commit Crimes"}, "https://www.torn.com/crimes.php");
            }
          }

          // HAPPY
          if (notifications.happy.enabled == true && newValue.happy.current != oldValue.happy.current) {
            let data = checkNotifyBars('happy', notifications, newValue, oldValue);
            if (data.notify == true) {
              createNotification("happy", "ReTorn: Happy", data.message, {action: 'Open', title: "Get Happy"}, "https://www.torn.com/item.php#candy-items");
            }
          }

          // LIFE
          if (notifications.life.enabled == true && newValue.life.current != oldValue.life.current) {
            let data = checkNotifyBars('life', notifications, newValue, oldValue);
            if (data.notify == true) {
              createNotification("life", "ReTorn: Life", data.message, {action: 'Open', title: "Get a Life"}, "https://www.torn.com/item.php#medical-items");
            }
          }

          // EDUCATION
          if (notifications.education.enabled == true && oldValue.education_current != 0 && newValue.education_current == 0) {
              createNotification("education", "ReTorn: Education", "Your education course has complete.", {action: 'Open', title: "Get Knowledge"}, "https://www.torn.com/education.php");
          }

          // TRAVEL
          if (notifications.travel.enabled == true && newValue.travel.time_left == 0 && newValue.travel.time_left != oldValue.travel.time_left) {
            createNotification("new_message", "ReTorn: Travel Notification", "You have landed in "+newValue.travel.destination+".", {action: 'Open', title: newValue.travel.destination}, "https://www.torn.com/index.php");
          }

        }
      }

    }).catch((error) => {console.log(error);});
  }
});

// Notification Checking for Energy, Nerve, Life, and Happy
function checkNotifyBars(type, notifications, newValue, oldValue) {
  let notify = false;
  let message = "Your "+type+" has reached it's value.";

  var value = notifications[type].value;
  var num = parseFloat(value.replace(/\D/g, ""));

  let perc = Math.floor(parseFloat(num) * 100) / 100;
  let eperc = Math.floor((newValue[type].current/newValue[type].maximum) * 100);
  let epercOld = Math.floor((oldValue[type].current/oldValue[type].maximum) * 100);

  console.log(eperc, perc, num, value);

  // LESS THAN
  if (value.includes("<")) {
    if (value.includes("%")) {
      if (eperc < perc && epercOld >= perc) {
        notify = true;
        message = "Your "+type+" has dropped below " + perc + "%.";
      }
    } else {
      if (newValue[type].current < num && oldValue[type].current >= num) {
        notify = true;
        message = "Your "+type+" has dropped below " + num + ".";
      }
    }
  }

  // GREATER THAN
  if (value.includes(">")) {
    if (value.includes("%")) {
      if (eperc > perc && epercOld <= perc) {
        notify = true;
        message = "Your "+type+" has increased above " + perc + "%.";
      }
    } else {
      if (newValue[type].current > num && oldValue[type].current <= num) {
        notify = true;
        message = "Your "+type+" has increased above " + num + ".";
      }
    }
  }

  // BASE VALUE
  if (!value.includes(">") && !value.includes("<")) {
    if (value.includes("%")) {
      if (num == 100) {
        if (eperc >= perc && epercOld < perc) {
          notify = true;
          message = "Your "+type+" is full.";
        }
      } else {
        if (eperc == perc) {
          notify = true;
          message = "Your "+type+" has reached " + perc + "%.";
        }
      }
    } else {
      if (newValue[type].current == num) {
        notify = true;
        message = "Your "+type+" has reached " + num + ".";
      }
    }
  }



  let data = {notify: notify, message: message}
  return data;
}

// Function for creating Notifications (Chrome/Firefox?)
function createNotification(name, title, message, actions, openURL = "https://www.torn.com/") {
  //if actions parameter is passed, add close button to end of action buttons, else default to single close button
  if (actions) {
    actions = [actions, { action: 'Close', title: 'Close' }]
  } else {
    actions = [{ action: 'Close', title: 'Close' }]
  }

  registration.showNotification(title, {
    body: message,
    data: {name: name, url: openURL},
    icon: '/images/ReTorn@Default.png',
    badge: '/images/ReTorn@96px.png',
    message,
    actions: actions
  })
}

// Event Listener for Notification Button Clicks
self.addEventListener('notificationclick', function (event) {
  if (event.action === 'Open' && event.notification.data.url) {
    chrome.tabs.create({'url': event.notification.data.url});
  }
  event.notification.close();
});


/* Watch for Easter Egg Competition images being loaded */
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
        let datenow = new Date();
        if (datenow.getMonth() == 3) { //Only trigger Egg events if it is April
          getValue("re_settings", "sync").then((response) => {
            if (response.re_settings != undefined) {
              var settings = response.re_settings;
              if (settings.notifications.notifications && settings.notifications.notifications.enabled && settings.notifications.notifications.enabled == true) {
                if (settings.events.eastereggs && settings.events.eastereggs.enabled && settings.events.eastereggs.enabled == true) {
                  console.log(details);
                  if (details.url && details.url.includes("step=eggImage") && details.url.includes("c=EasterEggs") && details.url.includes("access_token=")) {
                    createNotification("egg", "ReTorn: Egg Alert", "Egg detected on the page, look around. It could be fake!");
                  }
                }
              }
            }
          });
        }
  },
  {urls: ["https://www.torn.com/competition.php*"], types: ["image"]}
);
