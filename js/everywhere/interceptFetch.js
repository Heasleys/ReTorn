function interceptFetch(url,q, callback) {
    var originalFetch = window.fetch;
    window.fetch = function() {
        return originalFetch.apply(this, arguments).then(function(data) {
            let dataurl = data.url.toString();
            if (dataurl.includes(url) && dataurl.includes(q)) {
               const clone = data.clone();
               clone.json().then((response) => callback(response, data.url));
            }
            return data;
        });
    };
}

interceptFetch("torn.com","torn.com", (response, url) => {
 console.log("Found a fetch from: " + url, response);

/* Mini Profiles */
 if (url.includes('step=getUserNameContextMenu')) {
   miniProfiles(response);
 }

 /* Christmas Town */
  if (url.includes('christmas_town.php?q=move') || url.includes('christmas_town.php?q=initMap') || url.includes('christmas_town.php?q=miniGameAction')) {
    christmas_town(response);
  }

});

document.addEventListener('re_fetchInject', function (e)
{
    var url=e.detail;
});



/* Mini Profiles */
function miniProfiles(response) {
    if (response && response.user) {
      let message = "";

        if (response.user.role === "NPC") {
          //Loot Time??
        }

        if (response.user.lastAction && response.user.lastAction.seconds && !isNaN(response.user.lastAction.seconds)) {
          message = "Last Action: ";
          let seconds = response.user.lastAction.seconds;

          let lastaction = secondsToHmsShort(seconds);
          message += lastaction;
          let desc = $('#profile-mini-root').find('.description');
          let subdesc = desc.find('.sub-desc');

          let subdescText = subdesc.text();
          if (subdescText != "") {
            desc.parent('.profile-container').css("min-height", "40px");
            desc.css("height", "40px");
            desc.append(`<span class="sub-desc">`+message+`</span>`);
          } else {
            subdesc.text(message);
          }

          if (response.user.userID === "1468764") {
            $('#profile-mini-root').find('.icons').prepend(`<span class="right" style="font-size: 17px;" title="King of ReTorn">👑</span>`);
          }
        }
    }
}


/* Christmas Town */
var ct_friends;
var ct_itemlist;

function christmas_town(response) {
  if (response && response.mapData) {
    if (response.mapData.user) {
      if (response.mapData.user.user_id) {
        let user_id = response.mapData.user.user_id;
        $(`#ctUser${user_id}`).addClass("re_self");
      }
    }

    if (response.mapData.position) {
      if (response.mapData.position.x != undefined && response.mapData.position.y != undefined) {
        let x = (parseInt(response.mapData.position.x) * 30);
        let y = (parseInt(response.mapData.position.y) * -30);
        $('#re_walls').css('left', `${x}px`);
        $('#re_walls').css('top', `${y}px`);
      }
    }

    if (response.mapData.currentBlocking) {
      for (const [dir, val] of Object.entries(response.mapData.currentBlocking)) {
        if (val) {
          $('#re_walls').addClass(dir);
        } else {
          $('#re_walls').removeClass(dir);
        }
      }
    }

    if (response.mapData.items) {
      $('ul#nearby_items').empty();
      let qty = response.mapData.items.length;
      $('.re_nearby_items #item_qty').text(qty);
      if (qty > 0) {
        for (const [index, item] of Object.entries(response.mapData.items)) {
          if (item.image && item.image.url && item.position && item.position.x != undefined && item.position.y != undefined) {
            let name = itemURLtoName(item.image.url);
            let pos = `(${item.position.x}, ${item.position.y})`;
            $('ul#nearby_items').append(`<li><div class="re_list_item item">${name} ${pos}</div></li>`);
          }
        }
      }
    }

    // Logging obtaining items
    if (response.mapData.trigger && response.mapData.trigger.item) {
      let newitems = [];
      console.log("ITEMS trigger", response);
      let item = response.mapData.trigger.item;
      let item_id = item.image.url.match(/(?<=\/)(\d*)(?=\/)/g);
      console.log(item_id);
      if (item_id != undefined) {
        let gift = new Object();
        gift.timestamp = Date.now();
        gift.market_value = ct_itemlist[item_id].market_value;
        gift.category = "tornItems";
        gift.name = ct_itemlist[item_id].name;

        newitems.push(gift);

        let event = new CustomEvent("re_ct_additems", {detail: {items: newitems}});
        document.dispatchEvent(event);
      }
    }

    if (response.mapData.cellEvent) {
      if (response.mapData.cellEvent.type && response.mapData.cellEvent.type == "itemSpawn") {
        if (response.mapData.cellEvent.prizes.length > 0) {
          parseCTPrizes(response.mapData.cellEvent.prizes);
        }
      }
    }

    if (response.mapData.trigger && response.mapData.trigger.prizes) {
      if (response.mapData.trigger.prizes.length > 0) {
        parseCTPrizes(response.mapData.trigger.prizes);
      }
    }
  }

  if (response && response.prizes) {
    if (response.prizes.length > 0) {
      parseCTPrizes(response.prizes);
    }
  }

  // Friend Colors
  if (ct_friends && ct_friends.length != 0) {
    for (const [userid, friend] of Object.entries(ct_friends)) {
      if ($(`.users-layer #ctUser${userid}`).length != 0 && friend.color) {
        $(`.users-layer #ctUser${userid}`).addClass('re_friend');
        $(`.users-layer #ctUser${userid}`).find('svg').css('fill', friend.color);
      }
    }
  }
}



function parseCTPrizes(prizes) {
  let newitems = [];
  for (const [index, item] of Object.entries(prizes)) {
    let newitem = new Object();
    newitem.timestamp = Date.now();

    if (item.category && item.name) {
      newitem.category = item.category;
      newitem.name = item.name;

      // Torn Item with a real value
      if (item.category == "tornItems") {
        newitem.item_id = item.type;
        let item_id = item.type;

        if (ct_itemlist) {
          let market_value = ct_itemlist[item_id].market_value;
          newitem.market_value = market_value;
        } else {
          newitem.market_value = 0;
        }
      }
    }
    if (newitem) {
      newitems.push(newitem);
    }
  }
  let event = new CustomEvent("re_ct_additems", {detail: {items: newitems}});
  document.dispatchEvent(event);
}


document.addEventListener("re_ct_friends", function(msg) {
  if (msg.detail && msg.detail.re_ct) {
    let re_ct = msg.detail.re_ct;
    if (re_ct.friends) {
      ct_friends = re_ct.friends;
      christmas_town();
    }
  }
});

document.addEventListener("re_ct_itemlist", function(msg) {
  if (msg.detail && msg.detail.items) {
    let items = msg.detail.items;
    if (items) {
      ct_itemlist = items;
    }
  }
});


function secondsToHms(d) {
    d = Number(d);
    var days = Math.floor(d / 86400);
    var h = Math.floor(d % 86400 / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var dayDisplay = days > 0 ? days + (days == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dayDisplay + hDisplay + mDisplay + sDisplay;
}
function secondsToHmsShort(d) {
    d = Number(d);
    var days = Math.floor(d / 86400);
    var h = Math.floor(d % 86400 / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var dayDisplay = days > 0 ? days + (days == 1 ? "d " : "d ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? "h " : "h ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? "m " : "m ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? "s" : "s") : "";

    if (days > 1) {
      return days + " days";
    }

    return dayDisplay + hDisplay + mDisplay + sDisplay;
}


function itemURLtoName(url) {
  let name = "Unknown Item";

  //Keys
  if (url.includes('/images/items/christmas_town/keys/animated/bronze/')) {
    name = "Bronze Key";
  }
  if (url.includes('/images/items/christmas_town/keys/animated/silver/')) {
    name = "Silver Key";
  }
  if (url.includes('/images/items/christmas_town/keys/animated/gold/')) {
    name = "Gold Key";
  }

  //Key Chests
  if (url.includes('/images/items/christmas_town/chests/animated/1.gif')) {
    name = "Gold Chest";
  }
  if (url.includes('/images/items/christmas_town/chests/animated/2.gif')) {
    name = "Silver Chest";
  }
  if (url.includes('/images/items/christmas_town/chests/animated/3.gif')) {
    name = "Bronze Chest";
  }

  //Combo Chest
  if (url.includes('/images/items/christmas_town/combinationChest/animated/')) {
    name = "Combo Chest";
  }

  //Gifts
  if (url.includes('/images/items/christmas_town/gifts/animated/')) {
    name = "Mystery Gift";
  }

  return name;
}
