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

    <div class="re_row">
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
          <input type="checkbox" name='cheat1'>
          <label class="noselect" title="Highlight items">Snow</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='cheat2'>
          <label class="noselect" title="Highlight NPCs">Footsteps</label>
        </div>
        <div class="re_checkbox">
          <input type="checkbox" name='cheat3'>
          <label class="noselect" title="Highlight wall boundaries">Grid</label>
        </div>
      </div>
    </div>
    `);

  updateFriendsList();

  $('.re_content input[type="checkbox"]').change(function() {
    let checked = this.checked;
    let name = $(this).attr('name');
    let category = $(this).closest('.switch_wrap').attr('name');

    if (checked) {
      $("#user-map").addClass(`re_ct_${name}`);
    } else {
      $("#user-map").removeClass(`re_ct_${name}`);
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
    $(this).parent('.re_checkbox').find('input[type="checkbox"]').click();
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
            $('#friends_list').append(`<li data-userid="${userid}"><div class="re_list_x"><a class="remove-link"> <i class="delete-subscribed-icon"></i> </a></div><div class="re_list_item name"><a href="/profiles.php?XID=${userid}" target="_blank">${userid}</a></div><div class="re_list_item color" title="Change friend's character color"><input data-userid="${userid}" type="color" value="${value.color}"></div></li>`);
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

        $('#friends_list .re_list_x .remove-link .delete-subscribed-icon').click(function() {
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

function sendCTFriendEvent(re_ct) {
  let event = new CustomEvent("ct_friends", {detail: {re_ct: re_ct}});
  document.dispatchEvent(event);
}
