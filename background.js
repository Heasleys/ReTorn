//event listener for message passing
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg).then((data) => {
    sendResponse(data);
  })
  .catch((error) => {
    sendResponse(error)
  })
  return true;
});

// Event Listener for Starting Up chrome/extension
chrome.runtime.onStartup.addListener(() => {
  console.log("onStartup")
});

// Event Listener for Installing extension (update or new install)
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason == "install") {
    console.log("onInstalled INSTALL");
    newInstallation();
  }
  if (details.reason == "update") {
    console.log("onInstalled update")
  }
});

// Chrome Alarm for pulling API data every 30 seconds
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name == "required_api") {
    getValue("re_apikey", "local")
    .then((key) => {
      return pullRequiredAPI(key);
    })
    .then((r) => {
      console.log("ASS", r)
      if (r.code) {
        if (r.code == 2 || r.code == 10 || r.code == 13) { //key invalid, key owner is in federal jail, or key owner is inactive, then remove apikey
          logout();
        }
      }
    })
    .catch((error) => {
      clearAlarm("required_api");
    });
  }
});
function clearAlarm(name) {
  chrome.alarms.clear(name, (wasCleared) => {
    if (wasCleared) {
      console.log("ReTorn: Alarm for API has been removed.");
    }
  });
}
//function to create alarms
async function createAPIAlarm(minutes) {
  if (minutes == undefined) {
    minutes = 0.5;
  }
  chrome.alarms.get("required_api", (alarm) => {
    if (alarm == undefined) {
      chrome.alarms.create("required_api", {periodInMinutes: minutes});
    }
  });
}


// On changes to Storage, check for differences in data for notifications
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (changes?.re_user_data == undefined) return;
    console.log("[ReTorn][re_user_data] changes found: ",{changes: changes, areaName: areaName});

    const n = await getValue("notifications", "sync");
    console.log('[ReTorn][NOTIFICATIONS]',n)
    const tts = n?.text_to_speech?.enabled;
    const newValue = changes?.re_user_data?.newValue;
    const oldValue = changes?.re_user_data?.oldValue;

    console.log("NEW VALUES", newValue)

    if (isEmpty(newValue) || isEmpty(oldValue)) return;

    //check extension badge
    const badgeCount = newValue?.notifications?.events + newValue?.notifications?.messages;
    if ((badgeCount) > 0) {
      const badgeText = badgeCount.toString();
      chrome.action.setBadgeText({text: badgeText});
    } else {
      chrome.action.setBadgeText({text: ""});
    }
    
    if (isEmpty(n)) return;
    if (!n?.all_notifications?.enabled) return;

    //MESSAGES
    if (n?.messages?.enabled && (newValue?.notifications?.messages != oldValue?.notifications?.messages) && newValue?.notifications?.messages != 0) {
      await createNotification("new_message", "ReTorn: New Message", "You have " + newValue?.notifications?.messages + " new messages.", {action: 'Open', title: "View Messages"}, "https://www.torn.com/messages.php", tts);
    }

    //EVENTS
    if (n?.events?.enabled && (newValue?.notifications?.events != oldValue?.notifications?.events) && newValue?.notifications?.events != 0) {
      await createNotification("new_event", "ReTorn: New Event", "You have " + newValue?.notifications?.events + " new events.", {action: 'Open', title: "View Events"}, "https://www.torn.com/events.php", tts);
    }

    // COOLDOWNS - DRUGS
    if (n?.drug_cooldown?.enabled && oldValue?.cooldowns?.drug != 0 && newValue?.cooldowns?.drug == 0) {
      await createNotification("cooldown_drugs", "ReTorn: Drug Cooldown", "Your drug cooldown has expired.", {action: 'Open', title: "View Items"}, "https://www.torn.com/item.php#drugs-items", tts);
    }

    //COOLDOWNS - BOOSTERS
    if (n?.boosters?.enabled && oldValue?.cooldowns?.booster != 0 && newValue?.cooldowns?.booster == 0) {
      await createNotification("cooldown_boosters", "ReTorn: Booster Cooldown", "Your booster cooldown has expired.", {action: 'Open', title: "View Items"}, "https://www.torn.com/item.php#boosters-items", tts);
    }

    // COOLDOWNS - MEDICAL
    if (n?.medical?.enabled && oldValue?.cooldowns?.medical != 0 && newValue?.cooldowns?.medical == 0) {
      await createNotification("cooldown_medical", "ReTorn: Medical Cooldown", "Your medical cooldown has expired.", {action: 'Open', title: "View Items"}, "https://www.torn.com/item.php#medical-items", tts);
    }

    // ENERGY
    if (n?.energy?.enabled && newValue?.energy?.current != oldValue?.energy?.current) {
      let data = checkNotifyBars('energy', n, newValue, oldValue);
      if (data.notify == true) {
        await createNotification("energy", "ReTorn: Energy", data.message, {action: 'Open', title: "Visit Gym"}, "https://www.torn.com/gym.php", tts);
      }
    }

    // NERVE 
    if (n?.nerve?.enabled && newValue?.nerve?.current != oldValue?.nerve?.current) {
      let data = checkNotifyBars('nerve', n, newValue, oldValue);
      if (data.notify == true) {
        await createNotification("nerve", "ReTorn: Nerve", data.message, {action: 'Open', title: "Commit Crimes"}, "https://www.torn.com/crimes.php", tts);
      }
    }

    // HAPPY
    if (n?.happy?.enabled && newValue?.happy?.current != oldValue?.happy?.current) {
      let data = checkNotifyBars('happy', n, newValue, oldValue);
      if (data.notify == true) {
        await createNotification("happy", "ReTorn: Happy", data.message, {action: 'Open', title: "Get Happy"}, "https://www.torn.com/item.php#candy-items", tts);
      }
    }

    // LIFE
    if (n?.life?.enabled && newValue?.life?.current != oldValue?.life?.current) {
      let data = checkNotifyBars('life', n, newValue, oldValue);
      if (data.notify == true) {
        await createNotification("life", "ReTorn: Life", data.message, {action: 'Open', title: "Get a Life"}, "https://www.torn.com/item.php#medical-items", tts);
      }
    }

    // EDUCATION
    if (n?.education?.enabled && oldValue?.education_current != 0 && newValue?.education_current == 0) {
        await createNotification("education", "ReTorn: Education", "Your education course has complete.", {action: 'Open', title: "Get Knowledge"}, "https://www.torn.com/education.php", tts);
    }

    // TRAVEL
    if (n?.travel?.enabled && newValue?.travel?.time_left == 0 && newValue?.travel?.time_left != oldValue?.travel?.time_left) {
      await createNotification("new_message", "ReTorn: Travel Notification", "You have landed in "+newValue.travel.destination+".", {action: 'Open', title: newValue.travel.destination}, "https://www.torn.com/index.php", tts);
    }

    // CHAINS
    if (newValue?.chain?.cooldown == 0 && newValue?.chain?.current >= 10) {
      const types = ["time", "hit"]
      types.forEach((e) => {
        if (n["chain_"+e].enabled && n["chain_"+e].value != "") {
          let str = n["chain_"+e].value;
          str = str.replace(/ /g, '');
          let strArray = str.split(',');
          strArray.forEach(async (v) => {
            if (e == "time" && newValue?.chain?.timeout <= v && oldValue?.chain?.timeout >= v) {
              await createNotification("chain_time_"+v, "ReTorn: Chain Alert", "The chain will drop in " + newValue?.chain?.timeout + " seconds!", {action: 'Open', title: "Enemy List"}, "https://www.torn.com/blacklist.php", tts);
            }
            if (e == "hit" && newValue?.chain?.current >= v && oldValue?.chain?.current < v) {
              await createNotification("chain_hit_"+v, "ReTorn: Chain Alert", "The chain has reached " + newValue?.chain?.current + " hits.", {action: 'Open', title: "Chain"}, "https://www.torn.com/factions.php?step=your#/war/chain", tts);
            }
          });
        }
      })
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
async function createNotification(name, title, message, actions, openURL = "https://www.torn.com/", tts = false) {
    //await logger("notifications", "history", title, {title: title, message: message, timestamp: Date.now()});

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

    //if TTS is enabled, speak message body
    if (tts) {
      chrome.tts.speak(
        message,
        {'rate': 0.8},
        function() {
          if (chrome.runtime.lastError) {
            console.log('[ReTorn][Text-to-Speech] Error: ' + chrome.runtime.lastError.message);
          }
        }
      );
    }
}
// Event Listener for Notification Button Clicks
self.addEventListener('notificationclick', function (event) {
  if (event.action === 'Open' && event.notification.data.url) {
    chrome.tabs.create({'url': event.notification.data.url});
  }
  event.notification.close();
  chrome.tts.stop();
});

//get value
const getValue = async function(key, loc) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage[loc].get(key, function(v) {
        console.log("getValue", v, v[key])
        if (isEmpty(v)) {
          console.log({status: false, message: key + " is empty."})
          reject({status: false, message: key + " is empty."});
        } else {
          console.log({status: true, message: key + " has been retrieved."})
          resolve(v[key]);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

//set value
const setValue = async function(obj, loc) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage[loc]?.set(obj, function() {
        const keys = Object.keys(obj);
        console.log({status: true, message: keys[0] + " has been set."})
        resolve({status: true, message: keys[0] + " has been set."});
      });
    } catch (err) {
      reject(err);
    }
  });
};


//empty a value
const emptyValue = async function(key, loc) {
  return new Promise((resolve, reject) => {
    try {
      const obj = {[key]:{}}
      chrome.storage[loc]?.set(obj, function() {
        console.log({status: true, message: key + " has been emptied."})
        resolve({status: true, message: key + " has been emptied."});
      });
    } catch (err) {
      reject(err);
    }
  });
};

//Complete destruction of value
const removeValue = async function(key, loc) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage[loc].remove(key, function() {
        console.log({status: true, message: key + " has been removed."})
        resolve({status: true, message: key + " has been removed."});
      });
    } catch (err) {
      reject(err);
    }
  });
};


async function validateKey(key) {
  try {
    const r = await fetchAPI(key, 'user', 'basic,timestamp');
    //logger("api", "torn", "Validating User", {type: "user", id: "", selection: "basic,timestamp&comment=ReTorn", timestamp: Date.now()});
    const keyObj = {
      're_apikey': key
    };
    await setValue(keyObj, "local");
    return {status: true, message: "Your apikey is valid and has been saved."};
  }
  catch (error) {
    console.log("ReTorn: Error validating apikey.", error)
    throw error;
  }
}


// Function for pulling the required API data
async function pullRequiredAPI(apikey) {
    try {
      const data = await fetchAPI(apikey, 'user', 'basic,bars,icons,money,notifications,cooldowns,travel,education,networth,refills,perks,timestamp')
      await Promise.all([
        setValue({"re_user_data": data}, "local"),
        setValue({"re_user": {"name": data.name, "player_id": data.player_id}}, "local")
      ])
      .catch((error) => {throw error})
    }
    catch (error) {
      console.log("ERROR PULL", error)
      return error;
    }
    return {status: true, message: "Required API has been pulled."}
    //.finally(logger("api", "torn", "Required API", {type: "user", id: "", selection: "basic,bars,icons,money,notifications,cooldowns,travel,education,networth,refills,timestamp&comment=ReTorn", timestamp: Date.now()}))
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
    .catch((error) => {
      console.log('Fetch Error: ', error);
      return reject({status: false, message: "Fetch Error: " + error});
    })
    .then((response) => {
      if (response.status !== 200) {
        console.log("There was a problem connecting to Torn servers. Status Code: " + response.status);
        return reject({status: false, message: "There was a problem connecting to Torn servers. Status Code: " + response.status});
      } else {
        return response;
      }
    })
    .then(response => response.json())
    .then(data => parseAPI(data))
    .catch((error) => {//should be Torn reported error code (2 = invalid key, 9 = api disabled, etc)
      console.log("ERROR API", error)
      return reject(error);
    })
    .then((res) => {
        return resolve(res);
    })
    .catch((error) => {
      console.log('Other Fetch Error: ', error);
      return reject({status: false, message: "Fetch Error: " + error});
    });

  });
}

// Function for fetch API from Torn Stats
async function fetchTornStats(apikey, selection) {
  return new Promise((resolve, reject) => {
    if (apikey == undefined) {
      return reject({status: false, message: "Torn Stats apikey does not exist."})
    }

    if (apikey.length != 16) return reject({status: false, message: "Torn Stats apikey is invalid."})
    if (selection == undefined) return reject({status: false, message: "Torn Stats selection is invalid."})

    fetch('https://www.tornstats.com/api/v2/' + apikey + '/' + selection)
    .then(response => {
      if (response.status !== 200) {
        return reject({status: false, message: "There was a problem connecting to Torn Stats servers. Status Code: " + response.status})
      }
      return response.json();
    })
    .then(data => {
      if (data?.status == undefined) {
        return reject({status: false, message:"No status detected from Torn Stats."})
      }
      if (data.status) {
        console.log("ReTorn: Torn Stats status is true. Resolving.", data);
        return resolve(data);
      } else {
        console.log("ReTorn: Torn Stats status is false. Rejecting.", data);
        return reject({status: false, message: data.message})
      }
    })
    .catch((error) => {
      console.error('ReTorn: fetchTornStats error', error);
      return reject("ReTorn: Torn Stats fetch error.");
    });
  });
}

// Function for parsing the API data
function parseAPI(data) {
  return new Promise((resolve, reject) => {
    if (data.error != undefined) {
      //logger("error", "api", "Torn API Error code detected during parsing.", {code: data.error.code, error: data.error.error, timestamp: Date.now()});
      const e = {status: false, message: "API Error: Code: " + data.error.code + " | Message: " + data.error.error, code: data.error.code}
      setValue({"re_last_error": e}, "local");
      return reject(e);
    } else {
      removeValue("re_last_error", "local");
      console.log("data has been parsed", data)
      return resolve(data);
    }
  });
}

const deepExtend = function(out) {
  out = out || {};

  for (var i = 1, len = arguments.length; i < len; ++i) {
    var obj = arguments[i];

    if (!obj) {
      continue;
    }

    for (var key in obj) {
      if (!obj.hasOwnProperty(key)) {
        continue;
      }

      // based on https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
      if (Object.prototype.toString.call(obj[key]) === '[object Object]') {
        out[key] = deepExtend(out[key], obj[key]);
        continue;
      }

      out[key] = obj[key];
    }
  }

  return out;
};

function fixIndexAfterDelete(index, object) {
  Object.keys(object).forEach(function(k) {
    if (parseInt(k) > parseInt(index)) {
      let newkey = parseInt(k);
      newkey--;
      object[newkey] = object[k];
      delete object[k];
    }
  });
  return object;
}

function deleteNestedKey(obj, match) {
  console.log(JSON.stringify(obj), match)
  delete obj[match];
  for (let v of Object.values(obj)) {
    if (v instanceof Object) {
      deleteNestedKey(v, match);
    }
  }
}

async function handleMessage(msg) {
  const m = msg;

  switch (m.name) {    
    case "open_options":
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('/pages/options.html'));
      }
    break;

    case "set_api":
      if (m.apikey) {
        await validateKey(m.apikey); //validate if the apikey is real and working
        await Promise.all([pullRequiredAPI(m.apikey), createAPIAlarm()]); //pull api data and create chrome.alarm to periodically pull api data
        chrome.action.setPopup({popup: "pages/popup.html"}); //set popup to non-startup popup
        return {status: true, message: "Your apikey has been saved."}
      } else {
        throw {status: false, message: "The apikey was not passed correctly."}
      }
    break;

    case "set_torn_stats_api":
      if (m.apikey) {
        const r = await fetchTornStats(m.apikey, "");
        console.log("PEPE", r)
        if (r.status) {
          const keyObj = {
            're_torn_stats_apikey': m.apikey
          };
          await setValue(keyObj, "local");
        }
        return r;
      } else {
        throw {status: false, message: "The apikey was not passed correctly."}
      }
    break;

    case "get_torn_stats":
      if (m.selection) {
        const apikey = await getValue("re_torn_stats_apikey", "local");
        console.log("GET TS", apikey);
        const r = await fetchTornStats(apikey, m.selection);
        return r;
      } else {
        throw {status: false, message: "Selection not sent with message."}
      }
    break;

    case "get_session":
      if (m.value) {
        const r = await getValue(m.value, "session");
        return {status: true, message: m.value+ " has been retrieved from storage.", data: r}
      } else {
        throw {status: false, message: "Value not sent with message."}
      }
    break;

    case "merge_session":
      if (m.key && !isEmpty(m.object)) {
        const g = await getValue(m.key, "session");
        const merg = deepExtend(g, m.object);
        let obj = {};
        obj[m.key] = merg;
        console.log(obj)
        await setValue(obj, "session");
        return {status: true, message: `Object has been merged with ${m.key}`}
      } else {
        throw {status: false, message: "Key or object not properly sent with message."}
      }
    break;
    
    case "get_local":
      if (m.value) {
        const r = await getValue(m.value, "local");
        return {status: true, message: m.value+ " has been retrieved from storage.", data: r}
      } else {
        throw {status: false, message: "Value not sent with message."}
      }
    break;

    case "merge_local":
      if (m.key && !isEmpty(m.object)) {
        const g = await getValue(m.key, "local");
        const merg = deepExtend(g, m.object);
        let obj = {};
        obj[m.key] = merg;
        await setValue(obj, "local");
        return {status: true, message: `Object has been merged with ${m.key}`}
      } else {
        throw {status: false, message: "Key or object not properly sent with message."}
      }
    break;

    case "get_sync":
      if (m.value) {
        const r = await getValue(m.value, "sync");
        return {status: true, message: m.value+ " has been retrieved from storage.", data: r}
      } else {
        throw {status: false, message: "Value not sent with message."}
      }
    break;

    case "merge_sync":
      if (m.key && !isEmpty(m.object)) {
        const g = await getValue(m.key, "sync");
        const merg = deepExtend(g, m.object);
        let obj = {};
        obj[m.key] = merg;
        console.log(obj)
        await setValue(obj, "sync");
        return {status: true, message: `Object has been merged with ${m.key}`}
      } else {
        throw {status: false, message: "Key or object not properly sent with message."}
      }
    break;

    case "del_settings_index":
      if (m.key && m.setting) {
        const s = await getValue("settings", "sync");
        let newsettings = {[m.setting]: {}}
        let obj = s[m.setting];

        if (!isEmpty(obj)) {
          delete obj[m.key];
          const newobj = fixIndexAfterDelete(m.key, obj);
          newsettings[m.setting] = newobj;
          const merg = deepExtend(s, newsettings);
          let finalobj = {};
          finalobj["settings"] = JSON.parse(JSON.stringify(merg));

          await setValue(finalobj, "sync");
          return {status: true, message: `Key ${m.key} was deleted from ${m.setting}.`}
        }
        return {status: false, message: "Something went wrong deleting index. Object was empty."}
      } else {
        throw {status: false, message: "Key or object not sent with message."}
      }
    break;

    case "remove_value":
      if (m.key && m.location) {
        removeValue(m.key, m.location);
      } else {
        throw {status: false, message: "Key not sent with message."}
      }
    break;

    case "delete_settings_key":
      if (m.key && m.item) {
        const settings = await JSON.parse(JSON.stringify(await getValue('settings', 'sync')));
        let finalobj = {};

        if ((m.item).includes('.')) {//this is a dumb way to write this, but I am tired and could not figure out a better way lmao
          //this is basically checked for a nested item, christmas_town.friends
          //realistically this should be a loop incase of even deeper nested objects, but I don't have a use case for an even deeper nested object
          const keys = m.item.split('.');
          const obj = settings[keys[0]][keys[1]];
          console.log(obj,keys)

          deleteNestedKey(obj, m.key);

          const newobj = {
            [keys[0]]: {
              [keys[1]]: JSON.parse(JSON.stringify(obj))
            }
          }
          const merg = deepExtend(settings, newobj);
          finalobj["settings"] = JSON.parse(JSON.stringify(merg));
        } else {
          const obj = settings[m.item];
          deleteNestedKey(obj, m.key);
          const newobj = {
            [m.item]: JSON.parse(JSON.stringify(obj))
          }
          const merg = deepExtend(settings, newobj);
          finalobj["settings"] = JSON.parse(JSON.stringify(merg));
        }

        console.log("BIG FINAL LOL", finalobj)

        await setValue(finalobj, "sync");
      } else {
        throw {status: false, message: "Key or object not sent with message."}
      }
    break;

    case "full_reset":
      fullReset();
      return;
    break;

    case "force_torn_items":
      checkItemAPI(true);
      return;
    break;

    case "test_notification":
      let tts = m.tts ? m.tts : false;
      createNotification("test_not", "ReTorn: Test Notification", "This is a test of the notification system.", {action: 'Open', title: "Torn"}, "https://www.torn.com/", tts);
    break;

    case "logout":
      const lg = await logout();
      return lg;
    break;
    
    default:
      throw {status: false, message: "[" + m.name + "] message name was not found."}
    break;
  }
}

function isEmpty(obj) { //function for easily checking if an object is empty
  if (obj != undefined) {
    return Object.keys(obj).length === 0;
  }
  return true;
}


// Delete all settings and restore to default
function fullReset() {
  chrome.storage.sync.clear();
  chrome.storage.local.clear();
  chrome.storage.session.clear();
  clearAlarm("required_api");

  newInstallation();
}

//remove user data and api keys
async function logout() {
  try {
    const messages = await Promise.all([
      removeValue("re_apikey", "local"),
      removeValue("re_user", "local"),
      removeValue("re_user_data", "local"),
      removeValue("re_tornstats_apikey", "local"),
      //setValue({re_settings: {tornstats: {enabled: false}}}, "local")
      ]);
      console.log("ReTorn: Removed user data from storage", messages);
      chrome.action.setPopup({popup: "pages/popup_start.html"});
      chrome.action.setBadgeText({text: ""});
      clearAlarm("required_api");
      return {status: true, message: "You have been logged out."};
  }
  catch (error) {
    console.log({status: false, message: "Failed to log out properly.", error: error});
    return {status: false, message: "Failed to log out properly.", error: error};
  }
}


async function checkItemAPI(force = false) {
  try {
    const i = await getValue("re_items", "local");
    if ((Math.floor(Date.now() / 1000) - parseInt(i?.timestamp)) > 86400 || force) { //has items been updated in 1 day?
      try {
        const key = await getValue("re_apikey", "local");
        const r = await fetchAPI(key, 'torn', 'items,timestamp');
        setValue({"re_items": r}, "local")
      }
      catch (error) { //API key hasn't been set yet or some issue with fetching, so get old list of Torn items from file
        await setItemsFromFile();
      }
    }
  }
  catch (e) {
    await setItemsFromFile();
  }

  //.finally(logger("api", "torn", "Torn item data", {type: "torn", id: "", selection: "items,timestamp&comment=ReTorn", timestamp: Date.now()}))
}

async function clearTornStats() {
  try {
    const ts = await getValue("torn_stats", "local");
    for (const [key, value] of Object.entries(ts)) {
      if (value?.cache_until) {
        if ((Date.now()/1000) >= value.cache_until) {
          delete ts[key];
        }
      } else {
        delete ts[key];
      }
    }
    setValue({torn_stats: ts}, "local");
  }
  catch (e) {
    console.log("Clearing TornStats data error:", e)
  }
}

async function setItemsFromFile() {
  const url = chrome.runtime.getURL('/files/items.json');
  const f = await fetch(url);
  const json = await f.json();
  await setValue({"re_items": json}, "local");
}


async function startup() {
  chrome.action.setBadgeBackgroundColor({color: "#8ABEEF"}); //set badge color
  checkItemAPI();
  //TODO: check if tornstats api key exists, if not, disable tornstats (and maybe notify user somehow)
  await clearTornStats();
  try {
    const r = await getValue("re_user_data", "local");
      chrome.action.setPopup({popup: "pages/popup.html"});
      createAPIAlarm();
  }
  catch (e) {
    //user data hasn't been generated so ignore
  }
}

async function newInstallation() {
  const sett = chrome.runtime.getURL('/files/default_settings.json');
  const feat = chrome.runtime.getURL('/files/default_features.json');
  const noti = chrome.runtime.getURL('/files/default_notifications.json');


  const fetches = await Promise.all([fetch(sett),fetch(feat),fetch(noti)]);
  const jsons = await Promise.all([fetches[0].json(), fetches[1].json(), fetches[2].json()])
  await Promise.all([setValue({"settings": jsons[0]}, "sync"), setValue({"features": jsons[1]}, "sync"), setValue({"notifications": jsons[2]}, "sync"), setValue({"torn_stats": {}}, "local"), setValue({"re_ct_items": {}}, "local")])
}

/* 
    This is a workaround for the onEnabled chrome api. 
    onStartup/onUpdate does not trigger if extension is disabled and 
    re-enabled unless we have the management permission (which is too powerful for ReTorn)
    this function will run every time the Service Worker starts (every couple of minutes), but we only want the startup() function
    to run the exact first time the service Worker starts, so we use session data to check if
    it has already been ran during this session. Session data is removed when the extension is shut down in any way.
*/
async function serviceWorkerStart() {
  try {
    const z = await getValue("re_startup", "session");
    createAPIAlarm();
  }
  catch (e) {
    const obj = {
      re_startup: true
    }
    await setValue(obj, "session");
    startup();
  }
}
serviceWorkerStart();