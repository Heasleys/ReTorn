(function() {

var namesList = {}

// Case-Insensitive JQuery contains found here https://stackoverflow.com/questions/8746882/jquery-contains-selector-uppercase-and-lower-case-issue
jQuery.expr[':'].icontains = function(a, i, m) {
  return jQuery(a).text().toUpperCase()
      .indexOf(m[3].toUpperCase()) >= 0;
};


// Hide Chats Select
$(document).on('change', '#re_hidechats', function(event){
  let value = $(this).find(":selected").val();
  if (value != undefined) {
    chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {chat: {hide: value}}}, (response) => {
      settings.chat.hide = value;
      setChatHide();
    });
  }
});


//Observers Observer
const observer = new MutationObserver(function(mutations) {
  if ($('#chatRoot').length == 1) {
    setChatHide();
    //Start other observers
    const chatRoot = document.getElementById("chatRoot")
    tradeObserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
    tradeChatFilterObserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
    chatboxObserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
    hideChatsObserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
    observer.disconnect();
  }
});


//Trade Chat Search insert Observer
const tradeObserver = new MutationObserver(function(mutations) {
    if ($('div[class^="chat-box"][class*="trade"]').length != 0 && $('input.re_chat_search').length == 0) {
      insertChatSearch();
      tradeObserver.disconnect();
    }
});

//Trade Chat Filter - New Messages Observer
const tradeChatFilterObserver = new MutationObserver(function(mutations) {
  if ($('input.re_chat_search').length == 1) {
    if ($('input.re_chat_search').val() != "") {
      var v = $('input.re_chat_search').val().toLowerCase();
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          if (mutation.target && mutation.target.className) {
            if (mutation.target.className.includes('overview')) {
              if (mutation.target.parentNode.parentNode.parentNode.className.includes("trade")) {
                if (mutation.addedNodes[0] && mutation.addedNodes[0].className && mutation.addedNodes[0].className.includes('message')) {
                  if (mutation.addedNodes[0].children[1]) {
                    var message = mutation.addedNodes[0].children[1].innerText.toLowerCase();
                    if (!message.includes(v)) {
                      mutation.addedNodes[0].style.display = "none";
                    } else {
                      mutation.addedNodes[0].style.display = "block";
                    }
                  }
                }
              }
            }
          }
        }
      });
    }
  }
});

//Chatbox Observer
const chatboxObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    //new messages
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      if (mutation.addedNodes[0] && mutation.addedNodes[0].className) {
        if (mutation.addedNodes[0].className.includes('message')) {
          monitorChats($(mutation.addedNodes[0]).closest(`div[class^="chat-box_"]`)[0]);
        }
      }
    }
    //opening chatboxes
    if (mutation.target && mutation.target.className) {
      if (mutation.target.className.includes('chat-active')) {
        monitorChats(mutation.target);
      }
    }
  });

  //Already opened chats
  if ($("#chatRoot [class*='chat-active']").length != 0) {
    monitorChats();
  }

  //If namesList hasn't been filled, add the chatbox names to the namesList
  if (Object.keys(namesList).length === 0) {
    getNamesInAllChats();
  }
});


//Chat Hiding Observer
const hideChatsObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
  if (mutation.target && mutation.target.className) {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      //opening settings chatboxes
      if (mutation.target.className.includes('overview_')) {
        mutation.addedNodes.forEach(function(node) {
          if (node && node.className && node.className.includes('chat-settings-opts') && $('#re_hidechats').length == 0) {
            insertChatHide();
          }
        });
      }
    }
  }
  });

  //Already opened chats
  if ($("#chatRoot [class*='chat-active']").length != 0) {

  }
});


//Actually Start the Main Observer
observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});



function insertChatSearch() {
  $('div[class^="chat-box-head"] > div[class^="chat-box-title"][title="Trade"]').append(`
  <input type="text" class="re_chat_search" title="Filter Chat">
  `);

  $('input.re_chat_search').click(function() {
    event.stopPropagation();
  });

  $('input.re_chat_search').on('input', function() {
    var v = $(this).val().toLowerCase();
    var chats = $('div[class^="chat-box"][class*="trade"]').find('div[class^="overview"] > div[class^="message"]');
    chats.each(function() {
      if (v == "") {
        $(this).show();
      } else {
        let message = $(this).find('span').text().toLowerCase();
        if (!message.includes(v)) {
          $(this).hide();
        } else {
          $(this).show();
        }
      }
    });

  });
}

function monitorChats(target) {
  // Check for highlights
  chrome.runtime.sendMessage({name: "get_value", value: "re_chathighlights"}, (response) => {
    if (response.status && response.status == true && response.value) {
      if (response.value.re_chathighlights && !jQuery.isEmptyObject(response.value.re_chathighlights)) {
        for (const [key, value] of Object.entries(response.value.re_chathighlights)) {
          //Check for Name Highlights
          if (value.value && value.value.includes("@")) {
            let name = value.value.replace("@", "").toLowerCase();
            if (value.enabled) {
               $(`#chatRoot div[class^="message"] > a`).filter(function() {
                 return $.trim($(this).text()).replace(":", "").toLowerCase() == name;
               }).css("color", value.color);
            } else {
              $(`#chatRoot div[class^="message"] > a`).filter(function() {
                return $.trim($(this).text()).replace(":", "").toLowerCase() == name;
              }).css("color", "");
            }
          }

          //Check for text values
          else {
            let text = value.value.toLowerCase();
            if (value.enabled) {
               $(`#chatRoot div[class^="message"] > span:icontains(${text})`).parent(`div[class^="message"]`).css("background-color", value.color + "4D").css("font-weight", "bold");
            } else {
              $(`#chatRoot div[class^="message"] > span:icontains(${text})`).parent(`div[class^="message"]`).css("background-color", "").css("font-weight", "normal");
            }
          }
        };
      }
    }
  });

  // Check for names
  if (target != undefined) {
    getNamesInChatbox($(target));
  }
}


function getNamesInAllChats() {
  $(`#chatRoot div[class^="chat-box_"]`).not(`[class^="chat-box-settings"]`).each(function() {
    getNamesInChatbox($(this));
  })
}

function getNamesInChatbox(chatbox) {
  let title = chatbox.find(`[class^="chat-box-title"]`).attr("title").toLowerCase();
  if (!namesList[title]) {
    namesList[title] = [];
  }

  chatbox.find(`div[class^="message"] > a`).each(function() {
    let name = $.trim($(this).text()).replace(":", "");
    if (!namesList[title].includes(name)) {
      namesList[title].push(name);
    }
  });

  addTabComplete(chatbox, title);
}

function insertChatHide() {
  if ($('#chatRoot [class*="chat-settings-opts_"]').length > 0) {
    $('#chatRoot [class*="chat-settings-opts_"]:first').prepend(`
    <div class="mt1">
      <div class="re-chat-label bold">Hide Chats</div>
      <div class="re-chat-select-wrap">
        <select id="re_hidechats" class="re-chat-select">
          <option value="all">All Chats</option>
          <option value="players">Player Chats</option>
          <option value="none" selected>None</option>
        </select>
      </div>
      <div class="clear"></div>
    </div>
    `);
  }
  if (settings && settings.chat && settings.chat.hide != undefined) {
    $('#re_hidechats').val(settings.chat.hide);
  } else {
    $('#re_hidechats').val("none").change();
  }
}

function setChatHide() {
  let root = document.documentElement;
  if (settings && settings.chat && settings.chat.hide != undefined) {
    switch (settings.chat.hide) {
      case "none":
      root.style.setProperty('--re-chat-hide-players', "block");
      root.style.setProperty('--re-chat-hide-all', "block");
      break;
      case "players":
      root.style.setProperty('--re-chat-hide-players', "none");
      root.style.setProperty('--re-chat-hide-all', "block");
      break;
      case "all":
        root.style.setProperty('--re-chat-hide-players', "none");
        root.style.setProperty('--re-chat-hide-all', "none");
      break;
    }
  }
}

function addTabComplete(chatbox, title) {
    // tabComplete using plugin from: https://www.jqueryscript.net/form/Simple-jQuery-Tab-Completion-Plugin-Tab-Complete.html

  let textarea = chatbox.find(`[class^="chat-box-input"] textarea`);
  if (textarea.length != 0) {

    //remove previous event listeners and reset tabcomplete list (in case of new names added from chat)
    textarea.off("keydown");
    textarea.tabComplete("reset", []);

    //add tabComplete functionality
    textarea.tabComplete({
      getOptions:function() {
        return namesList[title]; //namesList for specific chatbox
      },
      getFormat: function(word, position) {
        return word.toString();
      },
    select: false,
    preventTabbing: true
    });

  }
}

})();
