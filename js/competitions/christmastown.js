var itemCount = 0;

$(document).ready(function() {
  if ($('div.captcha').length == 0) {
    var observer = new MutationObserver(function(mutations) {
      if ($("#ct-wrap").length == 1 && $('div.re_container').length == 0) {
        insertHead();
        observer.disconnect();
      }
    });

    observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
  }
});


function insertHead() {
  insertHeader($("#ct-wrap"), 'after', 'mb2');
  $('#re_title').text("Christmas Town");
  $('.re_content').html(`
    <div class="re_row" id="re_ct_main">
      <div class="switch_wrap mb4" name="highlight">
        <p class="re_ptitle">Highlights</p>
        <div class="re_checkbox">
          <input type="checkbox" name='items'>
          <label class="noselect" title="Highlight items">Items</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='npcs'>
          <label class="noselect" title="Highlight NPCs">NPCs</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='walls'>
          <label class="noselect" title="Highlight wall boundaries">Walls</label>
        </div>
        <div class="re_nearby_items mt3">
          <span><b>Nearby Items: </b><span id="item_qty">0</span></span>
          <div class="re_scrollbox">
            <ul class="re_list small" id="nearby_items">

            </ul>
          </div>
        </div>
      </div>

      <div class="switch_wrap mb4" name="friendslist">
        <p class="re_ptitle">Friend List</p>
        <input id='re_ct_friends' name='friend' type='number' title="Enter user ID to add a friend" placeholder="Enter friend's User ID">
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
      </div>
    </div>

    <div class="re_row" style="display: none;" id="re_ct_giftview">
      <div class="switch_wrap">
        <p class="re_ptitle">Item/Gift History</p>
        <div class="re_scrollbox">
          <ul class="re_list small" id="gifts_list">

          </ul>
        </div>
      </div>

      <div class="switch_wrap ml2">
        <p class="re_ptitle">Item Values</p>
        <span><b>Total: </b><span id="re_items_value">$0</span></span>
      </div>
    </div>
    `);

  $('.re_head .re_title').after(`<i class="fas fa-gift" id="re_ct_gifts" title="Toggle item/gift history"></i>`);
  updateFriendsList();

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

  $('#re_ct_gifts').click(function(e) {
    e.stopPropagation();
    $('#re_ct_main').toggle();
    $('#re_ct_giftview').toggle();
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

    chrome.runtime.sendMessage({name: "set_value", value_name: "re_ct", value: {[category]: {[name]: {"enabled": checked}}}});

  });

  $('.re_content #re_ct_friends').change(function() {
    let userid = $(this).val();
    if (!isNaN(userid)) {
      chrome.runtime.sendMessage({name: "set_value", value_name: "re_ct", value: {friends: {[userid]: {color: "#8ABEEF"}}}}, (response) => {
        updateFriendsList();
        $('#re_ct_friends').val('');
      });
    }
  });

  $('.re_checkbox > label').click(function() {
    let checkbox = $(this).parent('.re_checkbox').find('input[type="checkbox"]');
    checkbox.prop("checked", !checkbox.prop("checked"));
    checkbox.trigger("change");
  });

  chrome.runtime.sendMessage({name: "get_value", value: "re_ct"}, (response) => {
    if (response && response.value && response.value.re_ct) {
      let re_ct = response.value.re_ct;

      for (const [category, cat_value] of Object.entries(re_ct)) {
        for (const [index, value] of Object.entries(cat_value)) {
          if (value.enabled) {
            $(`.switch_wrap[name="${category}"] input[type="checkbox"][name="${index}"]`).prop( "checked", value.enabled).trigger("change");
          }
        }
      }

      // Friends list Event
      sendCTFriendEvent(re_ct);

    }
  });

  chrome.runtime.sendMessage({name: "get_value", value: "re_item_data", type: "local"}, (response) => {
    if (response && response.status != undefined && response.status == true) {
      items = response.value.re_item_data.items;
      sendCTItemListEvent(items);
    }
  });

  updateGiftsList();
}


function updateFriendsList() {
  chrome.runtime.sendMessage({name: "get_value", value: "re_ct"}, (response) => {
    if (response && response.value && response.value.re_ct) {
      let re_ct = response.value.re_ct;
      sendCTFriendEvent(re_ct);

      if (re_ct.friends) {
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
            chrome.runtime.sendMessage({name: "set_value", value_name: "re_ct", value: {friends: {[userid]: {color: color}}}}, (response) => {
              updateFriendsList();
            });
          }
        });

        $('#friends_list .re_list_item.x .remove-link .delete-subscribed-icon').click(function() {
          let parent = $(this).closest('li');
          let userid = parent.attr('data-userid');

          if (userid && parent.length > 0) {
            chrome.runtime.sendMessage({name: "del_value", value: "re_ct", key: userid}, (response) => {
              if (response.status) {
                parent.remove();
                $(`.users-layer #ctUser${userid}`).find('svg').css('fill', '');
                updateFriendsList();
              }
            })
          }
        });

      }
    }
  });
}

function updateGiftsList() {
  chrome.runtime.sendMessage({name: "get_value", value: "re_ct_items", type: "local"}, (response) => {
    if (response && response.status) {
      $('#gifts_list').empty();
      console.log(response.value.re_ct_items);
      let items = response.value.re_ct_items.items;
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
    } else {
      chrome.runtime.sendMessage({name: "set_value", value_name: "re_ct_items", value: {items: {}}, type: "local"});
    }
  });
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
    console.log("NEW ITEM", newitems);
    for (const [i, item] of Object.entries(newitems)) {
      if (item) {
        let index = itemCount;
        console.log(index);
        if (index != undefined) {
          items[index] = item;
          itemCount++;
        }
      }
    }
    console.log(items);
    chrome.runtime.sendMessage({name: "set_value", value_name: "re_ct_items", value: {items}, type: "local"}, (response) => {
      console.log(response);
      updateGiftsList();
    });
  }
});
