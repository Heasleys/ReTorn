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
  insertHeader($("#ct-wrap"), 'after', 'christmas_town_helper', 'mb2');
  $('.re_content').html(`
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

  $('#re_features_settings_view').prepend(ct_helper_button);

  $('#re_ct_gifts').click(function(e) {
    e.stopPropagation();
    $('#re_ct_main').toggle();
    $('#re_ct_giftview').toggle();
    $('#re_feature_settings').removeClass('re_active');
  });

  $('.re_content input[type="checkbox"]').change(function() {
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

  $('.re_content #re_ct_friendsTextbox').change(function() {
    let userid = $(this).val();
    if (!isNaN(userid)) {
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

  $('.re_checkbox > label').click(function() {
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
      const items = r?.data;
      if (items) {
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
    let items = {};

    let newitems = msg.detail.items;
    for (const [i, item] of Object.entries(newitems)) {
      if (item) {
        let index = itemCount;
        if (index != undefined) {
          items[index] = item;
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
