var itemCount = 0;
var observer = new MutationObserver(function(mutations) {
  if ($("#ct-wrap").length == 1 && $('div.re_container').length == 0) {
    initCT();
    observer.disconnect();
  }
});


$(document).ready(function() {
  if ($('div.captcha').length == 0) {
    observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
  }
});

function initCT() {
  insertHead();
  updateFriendsList();
  insertWalls();

  if (settings?.christmas_town) {
    const ct_settings = settings.christmas_town;

    for (const [category, cat_value] of Object.entries(ct_settings)) {
      for (const [index, value] of Object.entries(cat_value)) {
        if (value.enabled) {
          $(`.switch_wrap[name="${category}"] input[type="checkbox"][name="${index}"]`).prop( "checked", value.enabled).trigger("change");
        }
      }
    }

    // Friends list Event
    sendCTFriendEvent(ct_settings);
  }

  sendMessage({name: "get_local", value: "re_items"})
  .then((r) => {
      if (r.status) {
          items = r?.data?.items;
          sendCTItemListEvent(items);
      }
  })
  .catch((e) => console.error(e))

  updateGiftsList();
}



function insertHead() {
    //Insert container
    if ($(`.re_container[data-feature="${CT_HELPER}"]`).length != 0) return;
    const containerObject = {
        "feature": `${CT_HELPER}`,
        "insertLocation": "after",
        "elementClasses": "mb2",
        "bar": false
    }
    insertContainer($("#ct-wrap"), containerObject);
    const RE_CONTAINER = $(`.re_container[data-feature="${CT_HELPER}"]`);

    RE_CONTAINER.find('.re_content').html(`
    <div class="re_row" style="display: none;" id="re_ct_main">
      <div class="switch_wrap mb4" name="highlight">
        <p class="re_ptitle">Highlights</p>
        <div class="re_checkbox">
          <input type="checkbox" name='items'>
          <label class="noselect" title="Highlight items">Items</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='chests'>
          <label class="noselect" title="Highlight key chests">Chests</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='npcs'>
          <label class="noselect" title="Highlight NPCs">NPCs</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='walls'>
          <label class="noselect" title="Highlight wall boundaries">Walls</label>
        </div>
      </div>

      <div class="switch_wrap mb4" name="friendslist">
        <p class="re_ptitle">Friend List</p>
        <input id='re_ct_friendsTextbox' name='friend' type='number' title="Enter user ID to add a friend" placeholder="Enter friend's User ID">
        <div class="re_scrollbox">
          <ul class="re_list" id="friends_list">

          </ul>
        </div>
      </div>

      <div class="switch_wrap mb4" name="hide">
        <p class="re_ptitle">Hide</p>
        <div class="re_checkbox">
          <input type="checkbox" name='snow'>
          <label class="noselect" title="Hide snow">Snow</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='footsteps'>
          <label class="noselect" title="Hide footsteps">Footsteps</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='grid'>
          <label class="noselect" title="Hide grid">Grid</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='hud'>
          <label class="noselect" title="Hide HUD">HUD</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='players'>
          <label class="noselect" title="Hide other players (not friends)">Other Players</label>
        </div>
      </div>

      <div class="switch_wrap mb4" name="cheats">
        <p class="re_ptitle">Cheats</p>
        <div class="re_checkbox">
          <input type="checkbox" name='wreath'>
          <label class="noselect" title="Hide the wreath">Christmas Wreath</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='snowshooter'>
          <label class="noselect" title="Hide santas and show grinch">Snowball Shooter</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='santaclaws'>
          <label class="noselect" title="Hide non-animals">Santa Claws</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='wordfixer'>
          <label class="noselect" title="Unscramble words">Word Fixer</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='hangman'>
          <label class="noselect" title="List possible solutions">Hangman</label>
        </div>
        <div class="re_checkbox">
        <input type="checkbox" name='typocalypse'>
        <label class="noselect" title="Ignore typos">Typocalypse</label>
      </div>
      </div>
    </div>

    <div class="re_row" id="re_ct_giftview">
      <div class="switch_wrap mb4">
      <p class="re_ptitle">Nearby Items: <span id="item_qty">0</span></p>
        <div class="re_scrollbox">
          <ul class="re_list small" id="nearby_items">

          </ul>
        </div>
      </div>
      <div class="switch_wrap mb4">
      <p class="re_ptitle">Nearby Chests: <span id="chests_qty">0</span></p>
        <div class="re_scrollbox">
          <ul class="re_list small" id="nearby_chests">

          </ul>
        </div>
      </div>
      <div class="switch_wrap mb4">
        <p class="re_ptitle">Item/Gift History</p>
        <div class="re_scrollbox">
          <ul class="re_list small" id="gifts_list">

          </ul>
        </div>
      </div>

      <div class="switch_wrap mb4">
        <p class="re_ptitle">Item Values</p>
        <span><b>Total: </b><span id="re_items_value">$0</span></span>
      </div>
    </div>
    `);

  const ct_helper_button = `<li id="re_ct_gifts"><span class="re_menu_item"><i class="fa-solid fa-gears"></i><span class="re_menu_item_text">Helper settings</span></span></li>`

  RE_CONTAINER.find('#re_features_settings_view').prepend(ct_helper_button);

  RE_CONTAINER.find('#re_ct_gifts').click(function(e) {
    e.stopPropagation();
    $('#re_ct_main').toggle();
    $('#re_ct_giftview').toggle();
    $('#re_feature_settings').removeClass('re_active');
  });

  RE_CONTAINER.find('.re_content input[type="checkbox"]').change(function() {
    let checked = this.checked;
    let name = $(this).attr('name');
    let category = $(this).closest('.switch_wrap').attr('name');

    if (checked) {
      $("#ct-wrap").addClass(`re_ct_${name}`);
    } else {
      $("#ct-wrap").removeClass(`re_ct_${name}`);
    }

    const obj = {
      "christmas_town": {
        [category]: {
          [name]: {
            "enabled": checked
          }
        }
      }
    }
    sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
    .then((r) => {
      settings["christmas_town"][category][name]["enabled"] = checked;
    })
    .catch((e) => console.error(e))
  });

  RE_CONTAINER.find('.re_content #re_ct_friendsTextbox').change(function() {
    let userid = parseInt($(this).val());
    if (!isNaN(userid) && userid > 0) {
      const obj = {
        "christmas_town": {
          "friends": {
            [userid]: {
              "color": "#8ABEEF"
            }
          }
        }
      }
      sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
      .then((r) => {
        settings["christmas_town"]["friends"][userid] = {
            "color": "#8ABEEF"
        }

        updateFriendsList();
        $('#re_ct_friendsTextbox').val('');
      })
      .catch((e) => console.error(e))
    }
  });

  RE_CONTAINER.find('.re_checkbox > label').click(function() {
    let checkbox = $(this).parent('.re_checkbox').find('input[type="checkbox"]');
    checkbox.prop("checked", !checkbox.prop("checked"));
    checkbox.trigger("change");
  });
}

function insertWalls() {
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

function updateFriendsList() {
    let re_ct = settings?.christmas_town;
    sendCTFriendEvent(re_ct);

    if (re_ct?.friends) {
      $('#friends_list').empty();
      for (const [userid, value] of Object.entries(re_ct.friends)) {
        if (userid && value && value.color) {
          $('#friends_list').append(`<li data-userid="${userid}"><div class="re_list_item x"><a class="remove-link"> <i class="delete-subscribed-icon"></i> </a></div><div class="re_list_item name"><a href="/profiles.php?XID=${userid}" target="_blank">${userid}</a></div><div class="re_list_item color" title="Change friend's character color"><input data-userid="${userid}" type="color" value="${value.color}"></div></li>`);
        }
      }

      $('#friends_list input[type="color"]').change(function() {
        let color = $(this).val();
        let userid = $(this).attr("data-userid");
        if (userid && !isNaN(userid) && color) {
          const obj = {
            "christmas_town": {
              "friends": {
                [userid]: {
                  "color": color
                }
              }
            }
          }

          sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
          .then((r) => {
            settings["christmas_town"]["friends"][userid]["color"] = color;
            updateFriendsList();
          })
          .catch((e) => console.error(e))
        }
      });

      $('#friends_list .re_list_item.x .remove-link .delete-subscribed-icon').click(function() {
        const parent = $(this).closest('li');
        const userid = parent.attr('data-userid');

        if (userid && parent.length > 0) {
          sendMessage({"name": "delete_settings_key", "item": "christmas_town.friends", "key": userid})
          .then((r) => {
            if (r?.status) {
              parent.remove();
              $(`.users-layer #ctUser${userid}`).find('svg').css('fill', '');
              delete settings["christmas_town"]["friends"][userid];
              updateFriendsList();
            }
          })
          .catch((e) => console.error(e))
        }
      });

    }
  
}

function updateGiftsList() {
  sendMessage({name: "get_local", value: "re_ct_items"})
  .then((r) => {
    if (r?.status) {
      const items = r?.data?.items;
      if (items != undefined) {
        $('#gifts_list').empty();
        itemCount = Object.keys(items).length;
        let itemHTML = ``;
        let totalValue = 0;
        for (const [index, item] of Object.entries(items).reverse()) {
          if (item.market_value) {
            totalValue += item.market_value;
          }
          itemHTML += `<li><div class="re_list_item item">${item.name}</div></li>`;
        }
        $('#gifts_list').html(itemHTML);
        $('#re_items_value').text(`$${totalValue.toLocaleString('en-US')}`)
      }
    }
  })
  .catch((e) => console.error(e))
}


function sendCTFriendEvent(re_ct) {
  let event = new CustomEvent("re_ct_friends", {detail: {re_ct: re_ct}});
  document.dispatchEvent(event);
}

function sendCTItemListEvent(items) {
  let event = new CustomEvent("re_ct_itemlist", {detail: {items: items}});
  document.dispatchEvent(event);
}

document.addEventListener("re_ct_additems", function(msg) {
  if (msg.detail && msg.detail.items) {
    let items = {"items":{}};

    let newitems = msg.detail.items;
    for (const [i, item] of Object.entries(newitems)) {
      if (item) {
        let index = itemCount;
        if (index != undefined) {
          items["items"][index] = item;
          itemCount++;
        }
      }
    }

    sendMessage({"name": "merge_local", "key": "re_ct_items", "object": items})
    .then((r) => {
      updateGiftsList();
    })
    .catch((e) => console.error(e))
  }
});

window.addEventListener('hashchange', function() {
  if (window.location.hash != "#/") {
    $('.re_container').remove();
  } else {
    observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
  }
}, false);



/* Intercept Fetch Requests */
/* Christmas Town */
document.addEventListener('re_christmastown', function (r) {
  if (features?.pages?.christmas_town?.christmas_town_helper?.enabled) {
    christmas_town(r?.detail?.response);
  }
});

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
      $('ul#nearby_chests').empty();
      let itemqty = 0;
      let chestqty = 0;
      if (response.mapData.items.length > 0) {
        for (const [index, item] of Object.entries(response.mapData.items)) {
          if (item.image && item.image.url && item.position && item.position.x != undefined && item.position.y != undefined) {
            let name = itemURLtoName(item.image.url);
            let pos = `(${item.position.x}, ${item.position.y})`;
            if (item.image.url.includes('chests/animated')) {
              chestqty++;
              $('ul#nearby_chests').append(`<li><div class="re_list_item item">${name} ${pos}</div></li>`);
              $(`.items-layer .ct-item img[src="${item.image.url}"]`).parent('.ct-item').addClass('re_chest');
            } else {
              itemqty++;
              $('ul#nearby_items').append(`<li><div class="re_list_item item">${name} ${pos}</div></li>`);
              $(`.items-layer .ct-item img[src="${item.image.url}"]`).parent('.ct-item').addClass('re_item');
            }
          }
        }
      }
      $('#re_ct_giftview #item_qty').text(itemqty);
      $('#re_ct_giftview #chests_qty').text(chestqty);
    }

    // Logging obtaining items
    if (response.mapData.trigger && response.mapData.trigger.item) {
      let item = response.mapData.trigger.item;
      if (item.isReceived) {
        let gift = new Object();
        gift.timestamp = Date.now();

        let newitems = [];
        let item_id = item.image.url.match(/(?<=\/)(\d*)(?=\/)/g);
        if (item_id != undefined) {
          gift.market_value = ct_itemlist[item_id].market_value;
          gift.category = "tornItems";
          gift.name = ct_itemlist[item_id].name;
        } else {
          gift.name = response.mapData.trigger.message.replace("You find a ", "").replace("You find an ", "").replace("You found a ", "").replace("You found an ", "");
        }

        if (gift && gift.name) {
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

  if (response && response.rewards) {
    if (response.rewards.length > 0) {
      parseCTPrizes(response.rewards);
    }
  }

  // Friend Colors
  if (ct_friends && ct_friends.length != 0) {
    for (const [userid, friend] of Object.entries(ct_friends)) {
      if ($(`.users-layer #ctUser${userid}`).length != 0 && friend.color) {
        $(`.users-layer #ctUser${userid}`).addClass('re_friend');
        $(`.users-layer #ctUser${userid}`).find('svg').css('fill', friend.color);
        $(`.users-layer #ctUser${userid}`).find('path.iconPath').css('fill', friend.color);
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
    if (response.miniGameType == "Typocalypse") {
      typocalypse();
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

function typocalypse() {
  if ($('#ct-wrap.re_ct_typocalypse').length != 0) {
    $("div[class^='board'] input[class^='input']").off("keydown").on("keydown", function (evt, reEvent) {
      if (evt.which) {
        let text = $(this).val();
        let word = $("div[class^='board'] div[class^='gift']:not([class*='hide']):last div[class^='text']").text();
        let curText = word.replace(text, "");
        let char = curText.toUpperCase().charAt(0);
        if (evt.keyCode != char.charCodeAt(0)) {
          evt.preventDefault();
        }
      }
    });
  }
}

function sortWord(word) {
    var chars = word.toUpperCase().split("");
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
      if (item.category && item.name) {
        newitem.timestamp = Date.now();
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
        if (item.quantity && item.quantity > 0) {
          for (let i = 0; i < item.quantity; i++) {
            newitems.push(newitem);
          }
        } else {
          newitems.push(newitem);
        }
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