// Event Listener for Starting Up chrome/extension
chrome.runtime.onStartup.addListener(() => {
  checkLogin();
});
// Event Listener for Installing extension (update or new install)
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason == "install") {
    await newInstall();
    checkLogin();
  }
  if (details.reason == "update") {
    await checkUpdate();
    checkLogin();
  }
});
// if extension was enabled, verify user is logged in
chrome.management.onEnabled.addListener((extensionInfo) => {
  checkLogin();
});


// Delete all settings and restore to default
async function fullReset() {
  chrome.storage.sync.clear();
  chrome.storage.local.clear();

  await newInstall();
  checkLogin();
}

// Check if user has logged in with their API key
async function checkLogin() {
  //check for apikey
  await getValue("re_api_key", "sync")
  //then pull required api data
  .then(async (api) => {
    await pullRequiredAPI(api.re_api_key)
    //then check for user data
    .then(await getValue("re_user", "sync"))
    //then set popup and alarms
    .then(async (res) => {
      chrome.action.setPopup({popup: "pages/popup.html"});
      await createAPIAlarm();
      return getValue("re_user_data", "local");
    })
    //then set Badge if messages/events
    .then((response) => {
      chrome.action.setBadgeBackgroundColor({color: "#8ABEEF"});
      const data = response.re_user_data;
      if (data.notifications.events != undefined && data.notifications.messages != undefined) {
        if ((data.notifications.events + data.notifications.messages) > 0) {
          let badgeNum = parseInt(data.notifications.events + data.notifications.messages).toString();
          chrome.action.setBadgeText({text: badgeNum});
        } else {
          chrome.action.setBadgeText({text: ""});
        }
      }
    })

    .catch((error) => {
      console.log(error);
    });
  })

  .catch((error) => {
    console.log(error);
  });

  //then check Torn Item data
  await getValue("re_item_data", "local")
  .then((res) => {
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

// New Installation function for setting default settings
async function newInstall() {
  console.log("NEW INSTALL")
    const startup_settings = {
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
          },
          chain: {
            time: true,
            hit: false,
            alerts: {
              time: "30,60,90,120",
              hit: "4975,9975,24975"
            }
          }
        },
        events: {
          eastereggs: {
            enabled: false
          }
        }
      },
      re_chatuserhighlight: {

      },
      re_quicklinks: {

      }
    }

    const re_logs = {
      re_logs: {
        error: {
          api: {},
          page: {},
          background: {}
        },
        data: {
          deleted: {},
          set: {},
          set_local: {}
        },
        api: {
          torn: {},
          tornstats: {}
        },
        notifications: {
          history: {}
        }
      }
    }

    await setValue(re_logs, "local")
    .then(setValue(startup_settings, "sync"))
    .catch((error) => {
      console.log(error);
    })
}

// Function for updating ReTorn settings in case user has older extension version
function checkUpdate() {
  getValue("re_settings", "sync")
  .then(async (response) => {
    console.log("ReTorn: Checking for updates in settings...", response);
    const settings = response.re_settings;

    //checking npclist
    if (settings.npclist == undefined) {
      console.log("ReTorn: Update found. Adding NPC List update.");
      await setValue({re_settings: {npclist:{enabled: true}}}, "sync").then(res => console.log(res))
    }

    //if old npclist settings exist (v0.0.4), fix with new version (v0.0.5)
    if (settings.npclist == false) {
      console.log("ReTorn: Update found. Converting NPC list to v0.0.5");
      delete settings.npclist;
      await delValue("re_settings", "npclist", "sync").then(async () => await setValue({re_settings:{npclist:{enabled: false}}}, "sync")).then(res => console.log(res))
    }
    //if old npclist settings exist (v0.0.4), fix with new version (v0.0.5)
    if (settings.npclist == true) {
      console.log("ReTorn: Update found. Converting NPC list to v0.0.5");
      delete settings.npclist;
      await delValue("re_settings", "npclist", "sync").then(async () => await setValue({re_settings:{npclist:{enabled: true}}}, "sync")).then(res => console.log(res))
    }

    //checking tsevents
    if (settings.tsevents == undefined) {
      console.log("ReTorn: Update found. Adding tsevents update.");
      await setValue({re_settings: {tsevents: false}}, "sync").then(res => console.log(res))
    }

    //checking chat user highlights
    if (settings.chatuserhighlight == undefined) {
      console.log("ReTorn: Update found. Adding Chat User Highlight update.");
      await setValue({re_settings: {chatuserhighlight: false}}, "sync").then(res => console.log(res))
    }

    //checking left align
    if (settings.leftalign == undefined) {
      console.log("ReTorn: Update found. Adding Left Align update.");
      await setValue({re_settings: {leftalign: false}}, "sync").then(res => console.log(res))
    }

    //checking torn3d
    if (settings.torn3d == undefined) {
      console.log("ReTorn: Update found. Torn 3D");
      await setValue({re_settings: {torn3d: false}}, "sync").then(res => console.log(res))
    }

    //checking travel notifications
    if (settings.notifications.travel == undefined) {
      console.log("ReTorn: Update found. Adding Travel Notification update.");
      await setValue({re_settings: {notifications: {travel: {enabled: true}}}}, "sync").then(res => console.log(res))
    }

    //checking chain notifications
    if (settings.notifications.chain == undefined) {
      console.log("ReTorn: Update found. Adding Chain Notification update.");
      await setValue({re_settings: {notifications: {chain: {time: true, hit: false,alerts: {time: "30,60,90,120",hit: "4975,9975,24975"}}}}}, "sync").then(res => console.log(res))
    }

  })
  .then(() => {
    getValue("re_logs", "local")
    .then((response) => {
      console.log("ReTorn: Checking for updates - Log Data found. No update needed.", response);
    })
    .catch((error) => {
      console.log("ReTorn: Update found for Logs. Adding Logs data.", error);
      const re_logs = { re_logs: { error: { api: { }, page: { }, background: { } }, data: {deleted: { }, set: { }, set_local:{} }, api: {torn:{}, tornstats:{} }, notifications: {history: {}} } }
      setValue(re_logs, "local").catch((error) => {console.log(error);});
    });
  })
  .then(() => {
    getValue("re_chatuserhighlight", "sync")
    .then((response) => {
      console.log("ReTorn: Checking for updates - Chat User Highlights data found. No update needed.", response);
    })
    .catch((error) => {
      console.log("ReTorn: Update found for Chat User Highlights. Adding Chat User Highlights data.", error);
      setValue({"re_chatuserhighlight": {}}, "sync").catch((error) => {console.log(error);});
    });
  })

  .catch((error) => {
    console.log("Error when updating settings: " + error);
  });
}


// Chrome Alarm for pulling API data every 30 seconds
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name == "required_api") {
    getValue("re_api_key")
    .then((response) => {
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

//function to create alarms
function createAPIAlarm(minutes) {
  if (minutes == undefined) {
    minutes = 0.5;
  }
  chrome.alarms.get("required_api", (alarm) => {
    if (alarm == undefined) {
      chrome.alarms.create("required_api", {periodInMinutes: minutes});
    }
  });
}

// Function for Validating APIKEY before storing in settings
function validateAPIKEY(apikey) {
  return new Promise((resolve, reject) => {
    fetchAPI(apikey, 'user', 'basic,timestamp&comment=ReTorn')
    .then(async (response) => {
      await logger("api", "torn", "Validating User", {type: "user", id: "", selection: "basic,timestamp&comment=ReTorn", timestamp: Date.now()});
      await setValue({"re_api_key": apikey});
      await setValue({"re_user": {"name": response.name, "player_id": response.player_id}}, "sync");
      await pullRequiredAPI(apikey);
      await checkLogin();
      return resolve();
    })
    .catch((error) => {
      return reject(error);
    });
  });
}

// Function for fetching API from Torn
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
        logger("error", "background", "There was a problem connecting to the Torn servers. Status Code: "+ response.status, {timestamp: Date.now()});
        console.log("There was a problem connecting to Torn servers. Status Code: " + response.status);
        reject({status: false, message: "There was a problem connecting to Torn servers. Status Code: " + response.status});
      } else {
        return response;
      }
    })
    .then(response => response.json())
    .then(data => parseAPI(data))
    .then((res) => {
        return resolve(res);
    })
    .catch((error) => {
      logger("error", "background", "There was a Fetch Error: "+ error, {timestamp: Date.now()});
      console.log('Fetch Error: ', error);
      return reject({status: false, message: "Fetch Error: " + error});
    });

  });
}

// Function for fetching TornStats API data
function fetchTSAPI(apikey, selection) {
  return new Promise((resolve, reject) => {
    if (apikey == undefined || apikey.length > 16) {
      logger("error", "background", "Invalid apikey attempting to fetch Torn Stats API.", {timestamp: Date.now()});
      return reject({status: false, message: "Invalid apikey."})
    }
    if (selection == undefined) {
      logger("error", "background", "No selection given attempting to fetch Torn Stats API.", {timestamp: Date.now()});
      return reject({status: false, message: "No selection given."});
    }

    fetch('https://www.tornstats.com/api/v1/' + apikey + '/' + selection)

    .then((response) => {
      if (response.status !== 200) {
        console.log("There was a problem connecting to Torn Stats servers. Status Code: " + response.status);
        logger("error", "background", "There was a problem connecting to Torn Stats servers. Status Code: " + response.status, {timestamp: Date.now()});
        return reject({status: false, message: "There was a problem connecting to Torn Stats servers. Status Code: " + response.status});
      } else {
        response.json().then((data) => {
          if (data.status == undefined) {
            logger("error", "background", "No status detected from Torn Stats. Rejecting.", {timestamp: Date.now()});
            console.log({status: false, message: "No status detected from Torn Stats. Rejecting.", TSData: data});
            return reject({status: false, message: "No status detected from Torn Stats. Rejecting.", TSData: data});
          }

          if (data.status == false || data.status == "false") {
            console.log("ReTorn: Torn Stats status is false. Rejecting.", data);
            return reject(data);
          } else {
            console.log("ReTorn: Torn Stats status is true.", data);
            return resolve(data);
          }
        })
        .catch((error) => {
          return reject(error);
        });
      }

    })
    .catch((error) => {
      console.log('Fetch Error: ', error);
      reject({status: false, message: "Fetch Error: " + error});
    });
  });
}

// Function for parsing the API data
function parseAPI(data) {
  return new Promise(async (resolve, reject) => {
    if (data.error != undefined) {
      await logger("error", "api", "Torn API Error code detected during parsing.", {code: data.error.code, error: data.error.error, timestamp: Date.now()});
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
  return new Promise((resolve, reject) => {
    fetchAPI(apikey, 'user', 'bars,icons,money,notifications,cooldowns,travel,education,timestamp&comment=ReTorn')
    .then(async (data) => {
      await logger("api", "torn", "Required API", {type: "user", id: "", selection: "bars,icons,money,notifications,cooldowns,travel,education,timestamp&comment=ReTorn", timestamp: Date.now()});
      chrome.runtime.sendMessage({name: "popup_data", data: data});
      await setValue({"re_user_data": data}, "local");
      return resolve({status: true, message: "Required Torn API has been pulled."});
    })
    .catch((error) => {
      console.log(error);
      return reject({status: false, message: "There was an error pulling required Torn API."});
    })
  });
}

// Function for integrating Torn Stats features into ReTorn
function integrateTornStats() {
  return new Promise((resolve, reject) => {
    getValue("re_api_key")
    .then(response => fetchTSAPI(response.re_api_key, ""))
    .then(async (res) => {
      await logger("api", "tornstats", "Integrate Torn Stats", {status: res.status, message: res.message, selection: "", timestamp: Date.now()});
      setValue({"re_settings": {"tornstats": true}});
      return resolve(res);
    })
    .catch((error) => {
      console.log(error);
      return reject({status: false, message: "There was an error integrating Torn Stats.", error: error});
    })
  });
}

// function for saving data to storage locations
function setValue(value, type) {
  return new Promise((resolve, reject) => {
    var keys = Object.keys(value);
    if (type == undefined) {
      type = "sync";
    }
    if (type == "sync" || type == "local") {
      chrome.storage[type].get([keys[0]], async (response) => {
        let merged = {};
        if (Object.keys(response).length != 0 && response.constructor === Object) {
          merged = merge(response, value);
        } else {
          merged = value;
        }
        await chrome.storage[type].set(merged, (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return reject({status: false, message: chrome.runtime.lastError.message});
          } else {
            return resolve({status: true, message: "Value: " + keys[0] + " has been set."});
          }
        });
      })
    } else {
      return reject({status: false, message: "Type not sync or local when setting value.", value: value});
    }
  })
}

// function for pulling data from storage locations
function getValue(value, type) {
  return new Promise((resolve, reject) => {
    if (type == undefined) {
      type = "sync";
    }
    if (type == "sync" || type == "local") {
      chrome.storage[type].get([value], async (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return reject({status: false, message: chrome.runtime.lastError.message});
        }
        if (Object.keys(response).length === 0 && response.constructor === Object) {
          if (value != "re_logs") {
            // If re_logs doesn't exist yet, trying to log something means it will become a bad loop of death
            await logger("error", "background", "Could not find value in "+type+" storage. Value: " + value, {timestamp: Date.now()});
          }
          return reject({status: false, message: "Could not find value in storage.", value: value});
        } else {
          return resolve(response);
        }
      });
    } else {
      return reject({status: false, message: "Type not sync or local when getting value.", value: value})
    }
  });
}

// function for deleting nested values from storage (NOT fulling deleting values)
function delValue(value, key, storage, log) {
  if (storage == undefined) {
    storage = "sync";
  }
  return new Promise((resolve, reject) => {
    if (storage == "sync" || storage == "local") {
      chrome.storage[storage].get([value], async (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          await logger("error", "background", "Chrome Runtime Error while getting storage for deletion: " + chrome.runtime.lastError.message, {timestamp: Date.now()});
          return reject({status: false, message: chrome.runtime.lastError.message});
        } else {
          if (Object.keys(response).length === 0 && response.constructor === Object) {
            await logger("error", "background", "Could not find value in storage. Value: " + value, {timestamp: Date.now()});
            return reject({status: false, message: "Could not find value in storage.", value: value});
          }

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

          if (key == "npclist") {
            delete response.re_settings.npclist;
          }

          if (value == "re_logs") {
            if (key != undefined && log != undefined && log.type != undefined && log.subtype != undefined) {
              delete response.re_logs[log.type][log.subtype][key];
            }
          }

          chrome.storage[storage].set(response, async () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
              await logger("error", "background", "Chrome Runtime Error while deleting value "+ key + " from "+value+":  " + chrome.runtime.lastError.message, {timestamp: Date.now()});
              return reject({status: false, message: chrome.runtime.lastError.message});
            } else {
              if (value != "re_logs") {
                // If re_logs is asking to delete, it's because it's full, so trying to log something now means it will become a bad loop of death
                await logger("data", "deleted", key + " has been deleted from " + value + " storage.", {data: key, timestamp: Date.now()});
              }
              return resolve({status: true, message: "Value: " + key + " has been deleted."});
            }
          });
        }
      });
    } else {
      return reject({status: false, message: "Incorrect storage type: ", storage})
    }

  });
}

// Function for removing values from storage (complete destruction of value)
function removeValue(value, type) {
  return new Promise((resolve, reject) => {
    if (type == "sync" || type == "local") {
      chrome.storage[type].remove(value, async () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          await logger("error", "background", "Chrome Runtime Error while deleting "+type+" value "+ key + " from "+value+":  " + chrome.runtime.lastError.message, {timestamp: Date.now()});
          return reject({status: false, message: chrome.runtime.lastError.message});
        } else {
          await logger("data", "deleted", value + " has been deleted from " + type + " storage.", {data: value, timestamp: Date.now()});
          return resolve({status: true, message: type+" value: " + value + " has been removed."});
        }
      });
    } else {
      return reject({status: false, message: "Type not sync or local when removing value.", value: value})
    }
  });
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

// Function for adding logs to log data
async function logger(type, subtype, message, log) {
    await getValue("re_logs", "local")
    .then(async (response) => {
      //check if re_logs has type and subtype, if not, add them
      if (response.re_logs[type] == 'undefined') {
        response.relogs[type] = {};
        response.relogs[type][subtype] = {};
      }
      if (response.re_logs[type][subtype] == 'undefined') {
        response.relogs[type][subtype] = {};
      }

      //check if logs need shifted (max of 100 per subtype);
        let key = await shiftObject(response.re_logs[type][subtype], type, subtype);
        //create new log base
        let new_log = {re_logs: {}}
        new_log.re_logs[type] = {};
        new_log.re_logs[type][subtype] = {};

        await getValue("re_logs", "local")
        .then(async (res) => {
          new_log.re_logs[type][subtype][key] = {log, message: message}
          await setValue(new_log, "local")
          .then(() => {
            chrome.runtime.sendMessage({name: "log"});
          })
          .catch((error) => {
            console.log("Logger Error:", error);
          });
        })

    })
    .catch((error) => {
      console.log(error);
    });
}

// Assist function for logger to shift logger objects
async function shiftObject(object, type, subtype) {
  return new Promise(async (resolve, reject) => {
    let response = {"re_logs": {[type]: {[subtype]: object}}};
    const MAX = 100;
    if (object == null) {
      return resolve(0);
    }
    let keyCount = Object.keys(object).length; //Get length of object
    //Only keep last 100 entries
    if (keyCount >= MAX) {
      for (const [key, value] of Object.entries(object)) {
        let nextkey = parseInt(key)+1;
        if (object[nextkey]) {
          response.re_logs[type][subtype][key] = object[nextkey];
          if (nextkey == MAX) {
            delete response.re_logs[type][subtype][nextkey];
            await delValue("re_logs", nextkey, "local", {type: type, subtype: subtype}).then((res) => console.log(res))
          }
        }
        if (nextkey > MAX) {
          delete response.re_logs[type][subtype][key];
          await delValue("re_logs", key, "local", {type: type, subtype: subtype}).then((res) => console.log(res))
        }
      };
      await setValue(response, "local").then((res) => console.log("RES", res));
      return resolve(MAX-1);
    } else {
      return resolve(keyCount);
    }
  });
}

// Assist function for making logs more readable in settings menu
function objectStringify(object) {
  return JSON.stringify(object).replaceAll(`":{"`, ` -> `).replaceAll(`:`, ` = `).replaceAll(`{`, ``).replaceAll(`}`, ``).replaceAll(`"`, ``).replaceAll(`,`, `, `);
}

// Function for getting all Torn Item data and saving it to local storage
function getItemsAPI() {
  getValue("re_api_key")
  //API key is available, so get a fresh new list of Torn items from the API
  .then(response => fetchAPI(response.re_api_key, 'torn', 'items,timestamp&comment=ReTorn'))
  .then(async (data) => {
    await logger("api", "torn", "Torn item data", {type: "torn", id: "", selection: "items,timestamp&comment=ReTorn", timestamp: Date.now()});
    return data;
  })
  .then(data => setValue({"re_item_data": data}, "local"))
  .catch((error) => {
    console.log(error);
    const url = chrome.runtime.getURL('/files/items.json');
    //API key hasn't been set yet, so get old list of Torn items from file
    fetch(url).then((response) => response.json()).then((json) => setValue({"re_item_data": json}, "local"));
  });
}

// Listen for sent browser messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.name) {
    case "open_options":
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('/pages/options.html'));
      }
    break;

    case "full_reset":
      fullReset();
    break;

    case "force_torn_items":
      getItemsAPI();
    break;

    case "set_api":
      if (msg.apikey != undefined) {
        validateAPIKEY(msg.apikey)
        .then(async () => {
          chrome.action.setPopup({popup: "pages/popup.html"});
          sendResponse({status: true, message: "Your apikey has been saved."});
        })
        .catch((error) => {
          sendResponse(error);
        });
      } else {
        logger("error", "background", "The apikey entered was invalid.", {timestamp: Date.now()});
        sendResponse({status: false, message: "The apikey entered was invalid."});
      }
      return true;
    break;


    case "get_value":
      if (msg.value != undefined) {
        getValue(msg.value, msg.type)
        .then((response) => {
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
        delValue(msg.value, msg.key, msg.type)
        .then((response) => {
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
        if (msg.type == undefined) {
          msg.type = "sync";
        }
        setValue({[msg.value_name]: msg.value}, msg.type)
        .then(async (response) => {
          if (msg.type == "sync") {
            await logger("data", "set", objectStringify(msg.value) + " has been set in " + msg.value_name + ".", {data: msg.value, timestamp: Date.now()});
          }
          if (msg.type != undefined && msg.type == "local") {
            await logger("data", "set_local", objectStringify(msg.value) + " has been set in " + msg.value_name + ".", {data: msg.value, timestamp: Date.now()});
          }
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
      sendResponse({status: true, value: "Logout successful."});
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

    case "set_logger":
      if (msg.type != undefined && msg.subtype != undefined) {
        logger(msg.type, msg.subtype, msg.message, msg.log);
      }

      return true;
    break;

    case "pull_tornstats":
      if (msg.selection != undefined) {
        getValue("re_api_key").then((response) => {
          fetchTSAPI(response.re_api_key, msg.selection).then(async (res) => {
            await logger("api", "tornstats", "Torn Stats API", {status: res.status, message: res.message, selection: msg.selection, timestamp: Date.now()});
            sendResponse(res);
          }).catch(async (error) => {
            await logger("api", "tornstats", "Torn Stats API Error", {status: error.status, message: error.message, selection: msg.selection, timestamp: Date.now()});
            reject(error);
          })
        }).catch((error) => {
          reject(error);
        })

      }

      return true;
    break;

    default:
    logger("error", "background", "Message received does not exist: " + msg.name, {timestamp: Date.now()});
    sendResponse({status: false, message: "Message received does not exist."});
    return true;
    break;
  }

});

// On changes to Storage, check for differences in data for notifications
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  console.log({changes: changes, areaName: areaName});
  if (changes.re_user_data != undefined) {
    getValue("re_settings").then(async (response) => {
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
            await createNotification("new_message", "ReTorn: New Message", "You have " + newValue.notifications.messages + " new messages.", {action: 'Open', title: "View Messages"}, "https://www.torn.com/messages.php");
          }

          // EVENTS
          if (notifications.events.enabled == true && newValue.notifications.events != oldValue.notifications.events && newValue.notifications.events != 0) {
            await createNotification("new_event", "ReTorn: New Event", "You have " + newValue.notifications.events + " new events.", {action: 'Open', title: "View Events"}, "https://www.torn.com/events.php");
          }

          // COOLDOWNS - DRUGS
          if (notifications.drugs.enabled == true && oldValue.cooldowns.drug != 0 && newValue.cooldowns.drug == 0) {
           await createNotification("cooldown_drugs", "ReTorn: Drug Cooldown", "Your drug cooldown has expired.", {action: 'Open', title: "View Items"}, "https://www.torn.com/item.php#drugs-items");
          }

          // COOLDOWNS - BOOSTERS
          if (notifications.boosters.enabled == true && oldValue.cooldowns.booster != 0 && newValue.cooldowns.booster == 0) {
            await createNotification("cooldown_boosters", "ReTorn: Booster Cooldown", "Your booster cooldown has expired.", {action: 'Open', title: "View Items"}, "https://www.torn.com/item.php#boosters-items");
          }

          // COOLDOWNS - MEDICAL
          if (notifications.medical.enabled == true && oldValue.cooldowns.medical != 0 && newValue.cooldowns.medical == 0) {
            await createNotification("cooldown_medical", "ReTorn: Medical Cooldown", "Your medical cooldown has expired.", {action: 'Open', title: "View Items"}, "https://www.torn.com/item.php#medical-items");
          }

          // ENERGY
          if (notifications.energy.enabled == true && newValue.energy.current != oldValue.energy.current) {
            let data = checkNotifyBars('energy', notifications, newValue, oldValue);
            if (data.notify == true) {
              await createNotification("energy", "ReTorn: Energy", data.message, {action: 'Open', title: "Visit Gym"}, "https://www.torn.com/gym.php");
            }
          }

          // NERVE
          if (notifications.nerve.enabled == true && newValue.nerve.current != oldValue.nerve.current) {
            let data = checkNotifyBars('nerve', notifications, newValue, oldValue);
            if (data.notify == true) {
              await createNotification("nerve", "ReTorn: Nerve", data.message, {action: 'Open', title: "Commit Crimes"}, "https://www.torn.com/crimes.php");
            }
          }

          // HAPPY
          if (notifications.happy.enabled == true && newValue.happy.current != oldValue.happy.current) {
            let data = checkNotifyBars('happy', notifications, newValue, oldValue);
            if (data.notify == true) {
              await createNotification("happy", "ReTorn: Happy", data.message, {action: 'Open', title: "Get Happy"}, "https://www.torn.com/item.php#candy-items");
            }
          }

          // LIFE
          if (notifications.life.enabled == true && newValue.life.current != oldValue.life.current) {
            let data = checkNotifyBars('life', notifications, newValue, oldValue);
            if (data.notify == true) {
              await createNotification("life", "ReTorn: Life", data.message, {action: 'Open', title: "Get a Life"}, "https://www.torn.com/item.php#medical-items");
            }
          }

          // EDUCATION
          if (notifications.education.enabled == true && oldValue.education_current != 0 && newValue.education_current == 0) {
              await createNotification("education", "ReTorn: Education", "Your education course has complete.", {action: 'Open', title: "Get Knowledge"}, "https://www.torn.com/education.php");
          }

          // TRAVEL
          if (notifications.travel.enabled == true && newValue.travel.time_left == 0 && newValue.travel.time_left != oldValue.travel.time_left) {
            await createNotification("new_message", "ReTorn: Travel Notification", "You have landed in "+newValue.travel.destination+".", {action: 'Open', title: newValue.travel.destination}, "https://www.torn.com/index.php");
          }

          // CHAINS
          if (notifications.chain != undefined && newValue.chain.cooldown == 0 && newValue.chain.current >= 10) {
            if (notifications.chain.alerts != undefined) {
              // Notifications for chain time
              if (notifications.chain.time != undefined && notifications.chain.time == true && notifications.chain.alerts.time != undefined && notifications.chain.alerts.time != "") {
                let timeStr = notifications.chain.alerts.time;
                timeStr = timeStr.replace(/ /g, '');
                let times = timeStr.split(',');
                times.forEach(async (seconds) => {
                  if (newValue.chain.timeout <= seconds && oldValue.chain.timeout >= seconds) {
                    await createNotification("chain_time_"+seconds, "ReTorn: Chain Alert", "The chain will drop in " + newValue.chain.timeout + " seconds!", {action: 'Open', title: "Enemy List"}, "https://www.torn.com/blacklist.php");
                  }
                });
              }

              // Notifications for chain total hits
              if (notifications.chain.hit != undefined && notifications.chain.hit == true && notifications.chain.alerts.hit != undefined && notifications.chain.alerts.hit != "") {
                let hitStr = notifications.chain.alerts.hit;
                hitStr = hitStr.replace(/ /g, '');
                let hits = hitStr.split(',');
                hits.forEach(async (hit) => {
                  if (newValue.chain.current >= hit && oldValue.chain.current < hit) {
                    await createNotification("chain_hit_"+hit, "ReTorn: Chain Alert", "The chain has reached " + newValue.chain.current + " hits.", {action: 'Open', title: "Chain"}, "https://www.torn.com/factions.php?step=your#/war/chain");
                  }
                });
              }
            }
          } // Chain
        }
      }

    }).catch((error) => {console.log(error);});
  }
});

// Assist Function for Notification Checking for Energy, Nerve, Life, and Happy
function checkNotifyBars(type, notifications, newValue, oldValue) {
  let notify = false;
  let message = "Your "+type+" has reached it's value.";

  var value = notifications[type].value;
  var num = parseFloat(value.replace(/\D/g, ""));

  let perc = Math.floor(parseFloat(num) * 100) / 100;
  let eperc = Math.floor((newValue[type].current/newValue[type].maximum) * 100);
  let epercOld = Math.floor((oldValue[type].current/oldValue[type].maximum) * 100);

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
async function createNotification(name, title, message, actions, openURL = "https://www.torn.com/") {
    await logger("notifications", "history", title, {title: title, message: message, timestamp: Date.now()});

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
    });
}

// Event Listener for Notification Button Clicks
self.addEventListener('notificationclick', function (event) {
  if (event.action === 'Open' && event.notification.data.url) {
    chrome.tabs.create({'url': event.notification.data.url});
  }
  event.notification.close();
});


/* Watch for Easter Egg Competition images being loaded in WebRequest */
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
        let datenow = new Date();
        if (datenow.getMonth() == 3) { //Only trigger Egg events if it is April
          getValue("re_settings", "sync").then(async (response) => {
            if (response.re_settings != undefined) {
              var settings = response.re_settings;
              if (settings.notifications.notifications && settings.notifications.notifications.enabled && settings.notifications.notifications.enabled == true) {
                if (settings.events.eastereggs && settings.events.eastereggs.enabled && settings.events.eastereggs.enabled == true) {
                  console.log(details);
                  if (details.url && details.url.includes("step=eggImage") && details.url.includes("c=EasterEggs") && details.url.includes("access_token=")) {
                    await createNotification("egg", "ReTorn: Egg Alert", "Egg detected on the page, look around. It could be fake!");
                  }
                }
              }
            }
          }).catch(async (error) => {
            console.log(error);
            await logger("error", "background", "There was a problem getting settings for Easter Egg Alerts. "+ error, {timestamp: Date.now()});
          });
        }
  },
  {urls: ["https://www.torn.com/competition.php*"], types: ["image"]}
);
