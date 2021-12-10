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

var wordFixer = false;
var hangman = false;
var hangmanPossibleSolutions = [];

//Thank you to Helcostr and Ahab for originally providing the list of words.
const CT_WORDLIST = ["elf","eve","fir","ham","icy","ivy","joy","pie","toy","gift","gold","list","love","nice","sled","star","wish","wrap","xmas","yule","angel","bells","cider","elves","goose","holly","jesus","merry","myrrh","party","skate","visit","candle","creche","cookie","eggnog","family","frosty","icicle","joyful","manger","season","spirit","tinsel","turkey","unwrap","wonder","winter","wreath","charity","chimney","festive","holiday","krampus","mittens","naughty","package","pageant","rejoice","rudolph","scrooge","snowman","sweater","tidings","firewood","nativity","reindeer","shopping","snowball","stocking","toboggan","trimming","vacation","wise men","workshop","yuletide","chestnuts","christmas","fruitcake","greetings","mince pie","mistletoe","ornaments","snowflake","tradition","candy cane","decoration","ice skates","jack frost","north pole","nutcracker","saint nick","yule log","card","jolly","hope","scarf","candy","sleigh","parade","snowy","wassail","blizzard","noel","partridge","give","carols","tree","fireplace","socks","lights","kings","goodwill","sugarplum","bonus","coal","snow","happy","presents","pinecone","holly and ivy"];

function christmas_town(response) {
  insertCTWalls();
  if (response && response.mapData) {
    resetCTMiniGameCheats();
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
      let item = response.mapData.trigger.item;
      if (item.isReceived) {
        let newitems = [];
        let item_id = item.image.url.match(/(?<=\/)(\d*)(?=\/)/g);
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


  if (response && response.miniGameType) {
    if (response.miniGameType == "WordFixer") {
      wordFixer = true;
    }
    if (response.miniGameType == "Hangman") {
      hangman = true;
    }
  }

  if (wordFixer) {
    if ($('#ct-wrap.re_ct_wordfixer').length != 0) {
      if ($("#re_wordFixer").length == 0) {
        $("#ct-wrap").after(`<div class="re_minigame_cheatwrap" id="re_wordFixer"></div>`);
      }

      if (response.progress && response.progress.word) {
        wordSolver(response.progress.word);
      }

      if (response.prizes) {
        resetCTMiniGameCheats();
      }
    } else {
      $("#re_wordFixer").remove();
    }
  }

  if (hangman) {
    if ($('#ct-wrap.re_ct_hangman').length != 0) {
      if ($("#re_hangman").length == 0) {
        $("#ct-wrap").after(`<div class="re_minigame_cheatwrap" id="re_hangman"></div>`);
      }

      if (response.progress && response.progress.words && response.progress.words[0] != undefined) {
        let length = 0;

        if (response.progress.words.length > 1) {
          for (let i = 0; i < response.progress.words.length; i++) {
            length += response.progress.words[i];
          }
          length += (response.progress.words.length - 1);
        } else {
          length = response.progress.words[0];
        }

        for (let word of CT_WORDLIST) {
          if (word.length == length) {
            hangmanPossibleSolutions.push(word.toLowerCase());
          }
        }

        checkHangmanPositions();
      }

      if (response.positions) {
        checkHangmanPositions();
      }
    }
  }
}


function checkHangman() {
  let solutionsText = "";
  for (let word of hangmanPossibleSolutions) {
    solutionsText += `${word.toUpperCase()}, `;
  }

  solutionsText = solutionsText.replace(/,\s*$/, "");
  $(`#re_hangman`).html(`<span>Possible Solution: <b>${solutionsText}</b></span>`);
}

function checkHangmanPositions() {
  //Remove words if wrong letters
  $('[class^="ctMiniGameWrapper"] [class^="alphabet"] > li[class^="wrong-letter"]').each(function() {
    let letter = $(this).text().toLowerCase().trim();
    checkHangmanLetter(letter);
  });

  //Remove words if words don't have letter in correct positions
  $('[class^="ctMiniGameWrapper"] [class^="word"] > li[class^="cell"]').each(function() {
    let letter = $(this).text().toLowerCase();
    if (letter) {
      let index = $('[class^="ctMiniGameWrapper"] [class^="word"] > li').index($(this));
      checkHangmanLetterPosition(letter, index);
    }
  });

  //Remove words if words don't have space in correct position
  $('[class^="ctMiniGameWrapper"] [class^="word"] > li[class^="empty-cell"]').each(function() {
    let index = $('[class^="ctMiniGameWrapper"] [class^="word"] > li').index($(this));
    checkHangmanLetterPosition(" ", index)
  });

  //Remove words with spaces if no spaces on board
  if ($('[class^="ctMiniGameWrapper"] [class^="word"] > li[class^="empty-cell"]').length == 0) {
    checkHangmanLetter(" ");
  }

  checkHangman();
}

function checkHangmanLetter(letter) {
  for (var i = hangmanPossibleSolutions.length - 1; i >= 0; i--) {
    let word = hangmanPossibleSolutions[i];
    if (word.indexOf(letter) != -1) {
      let i = hangmanPossibleSolutions.indexOf(word);
      if (i > -1) {
        hangmanPossibleSolutions.splice(i,1);
      }
    }
  }
}

function checkHangmanLetterPosition(letter, index) {
  for (var i = hangmanPossibleSolutions.length - 1; i >= 0; i--) {
    let word = hangmanPossibleSolutions[i];
    if (word.charAt(index) != letter) {
      let i = hangmanPossibleSolutions.indexOf(word);
      if (i > -1) {
        hangmanPossibleSolutions.splice(i,1);
      }
    }
  }
}

function sortWord(word) {
    var chars = word.toUpperCase().trim().split("");
    chars.sort();
    return chars.join("");
}
function wordSolver(jumbled) {
    let solution;
    for (var word of CT_WORDLIST) {
        if (sortWord(word) == sortWord(jumbled)) {
            solution = word.toUpperCase();
        }
    }
    $(`#re_wordFixer`).empty();
    if (solution) {
      $(`#re_wordFixer`).html(`<span>Solution: <b>${solution}</b></span>`);
    } else {
      $(`#re_wordFixer`).html(`<span>Could not find solution.</span>`);
    }
}

function parseCTPrizes(prizes) {
  let newitems = [];
  for (const [index, item] of Object.entries(prizes)) {
    if (item.isReceived) {
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
  }

  if (newitems.length != 0) {
    let event = new CustomEvent("re_ct_additems", {detail: {items: newitems}});
    document.dispatchEvent(event);
  }
}

function resetCTMiniGameCheats() {
  wordFixer = false;
  hangman = false;
  hangmanPossibleSolutions = [];
  $('.re_minigame_cheatwrap').remove();
}

function insertCTWalls() {
  if ($('#re_walls').length == 0) {
    $('.negative-coordinates').append(`
      <div>
        <div id="re_walls">
          <div class="lefttop"></div>
          <div class="lefttop2"></div>
          <div class="top"></div>
          <div class="righttop"></div>
          <div class="righttop2"></div>
          <div class="right"></div>
          <div class="rightbottom"></div>
          <div class="rightbottom2"></div>
          <div class="bottom"></div>
          <div class="leftbottom"></div>
          <div class="leftbottom2"></div>
          <div class="left"></div>
        </div>
      </div>
      `);
  }
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
