(function() {

//namesList for remembering names in chats/group chats for TabComplete
var namesList = {}

// Case-Insensitive JQuery contains found here https://stackoverflow.com/questions/8746882/jquery-contains-selector-uppercase-and-lower-case-issue
jQuery.expr[':'].icontains = function(a, i, m) {
    return jQuery(a).text().toUpperCase()
        .indexOf(m[3].toUpperCase()) >= 0;
};

initEventListeners();


//Observers Observer
const observer = new MutationObserver(function(mutations) {
    if ($('#chatRoot').length == 1) {
      setChatHide();
      //Start other observers
      const chatRoot = document.getElementById("chatRoot");
      if (features?.chat?.trade_search.enabled) {
        tradeObserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
        tradeChatFilterObserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
      }
      chatboxObserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
      hideChatsObserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
      observer.disconnect();
    }
});


//Trade Chat Search insert Observer
const tradeObserver = new MutationObserver(function(mutations) {
    let tradetitle = $('div[class*="chat-box-head"] > div[class*="chat-box-title"][title="Trade"] span[class*="name_"]');
    let chatsearch = $('input.re_chat_search');
    let tradebox = $('div[class*="chat-box"][class*="trade"]');

    //if trade chat box exists and chat search box does not exists yet, make it exist
    if (tradebox.length != 0 && chatsearch.length == 0) {
      insertChatSearch();
    }

    //if trade chat search already exists, check if it's in the correct place, and if not in the correct place, put it in the right place
    if (tradebox.length != 0 && chatsearch.length == 1 && tradetitle.length == 1) {
      tradetitle.prev('input.re_chat_search').insertAfter(tradetitle);
    }
});
//Trade Chat Filter - New Messages Observer
const tradeChatFilterObserver = new MutationObserver(function(mutations) {
    if ($('input.re_chat_search').length == 1) {
      if ($('input.re_chat_search').val() != "") {
        const v = $('input.re_chat_search').val().toLowerCase();
        mutations.forEach(function(mutation) {
            if (mutation?.addedNodes?.length > 0) {
                  if (mutation?.target?.className?.includes('overview')) {
                    if (mutation?.target?.parentNode?.parentNode?.parentNode?.className?.includes("trade")) {
                      if (mutation?.addedNodes[0]?.className?.includes('message')) {
                        if (mutation?.addedNodes[0]?.children[1]) {
                          const message = mutation?.addedNodes[0]?.children[1]?.innerText.toLowerCase();
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

            //opening chatboxes
            if (mutation?.target?.className.includes('chat-active')) {
                filterTradeChatMessages();
            }
            
        });
      }
    }
});
//Chat Hiding Observer
const hideChatsObserver = new MutationObserver(function(mutations) {
mutations.forEach(function(mutation) {
if (mutation?.target?.className) {
    if (mutation?.addedNodes?.length > 0) {
        //opening settings chatboxes
        if (mutation?.target?.className.includes('overview_')) {
            mutation.addedNodes.forEach(function(node) {
                if (node?.className.includes('chat-settings-opts') && $('#re_hidechats').length == 0) {
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

//Chatbox Observer
const chatboxObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      //new messages
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        if (mutation.addedNodes[0] && mutation.addedNodes[0].className) {
          if (mutation.addedNodes[0].className.includes('message')) {
            monitorChats($(mutation.addedNodes[0]).closest(`div[class*="chat-box_"]`)[0]);
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


 //Actually Start the Main Observer
observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

function initEventListeners() {
    // Hide Chats Select change event
    $(document).on('change', '#re_hidechats', function(event){
        const value = $(this).find(":selected").val();
        if (value != undefined) {
            const obj = {chat_hide: value}
            sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
            .then((r) => {
                settings.chat_hide = value;
                setChatHide();
            })
            .catch((e) => console.error(e))
        }
    });

    //Trade chat search input event
    $(document).on('input', 'input.re_chat_search', function(event){
        filterTradeChatMessages();
    });
}
function insertChatSearch() {
    $('div[class*="chat-box-head"] > div[class*="chat-box-title"][title="Trade"] span[class*="name_"]').after(`
    <input type="text" class="re_chat_search" title="Filter Chat" autocomplete="off">
    `);

    $('input.re_chat_search').click(function(e) {
        e.stopPropagation();
    });
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
    if (settings?.chat_hide != undefined) {
        $('#re_hidechats').val(settings?.chat_hide);
    } else {
        $('#re_hidechats').val("none").change();
    }
}

function setChatHide() {
    let root = document.documentElement;
    if (settings?.chat_hide) {
        switch (settings?.chat_hide) {
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
function filterTradeChatMessages() {
    const v = $('input.re_chat_search').val().toLowerCase();
    const chats = $('div[class*="chat-box"][class*="trade"]').find('div[class*="overview"] > div[class*="message"]');
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
}
function monitorChats(target) {
    if (features?.chat_highlights) {
        // Check for highlights
        const highlights = settings?.chat_highlights;
        if (highlights && !jQuery.isEmptyObject(highlights)) {
          for (const [key, value] of Object.entries(highlights)) {
            if (value.enabled) {
                //Check for Name Highlights
                if (value.value && value.value.includes("@")) {
                let name = value.value.replace("@", "").toLowerCase();
                if (value.enabled) {
                    $(`#chatRoot div[class*="overview"] div[class*="message_"] > a`).filter(function() {
                    return $.trim($(this).text()).replace(":", "").toLowerCase() == name;
                    }).css("color", value.color);
                } else {
                    $(`#chatRoot div[class*="overview"] div[class*="message_"] > a`).filter(function() {
                    return $.trim($(this).text()).replace(":", "").toLowerCase() == name;
                    }).css("color", "");
                }
                }
                //check chat messages 
                else {
                    let text = value.value.toLowerCase();
                    //value can be within a word (EX: 'heas' would trigger on 'heasley' or 'heasly')
                    if (text && text.includes("*")) {
                        text = text.replace('*', '');
                        $(`#chatRoot div[class*="overview"] div[class*="message_"] > span:icontains(${text})`).parent(`div[class*="message_"]`).css("background-color", value.color + "4D").css("font-weight", "bold");
                    } else {//must be exact match
                        const match = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                        const rgex = new RegExp(`\\b${match}\\b`);
                        $(`#chatRoot div[class*="overview"] div[class*="message_"] > span`).filter(function () {
                            return rgex.test($(this).text()); 
                        }).parent(`div[class*="message_"]`).css("background-color", value.color + "4D").css("font-weight", "bold");
                    }
                }
            }
          };
        }
    }
      

    // Check for names
    if (target != undefined) {
      getNamesInChatbox($(target));
    }
}
  
//functions for TabComplete in chatboxes
function addTabComplete(chatbox, title) {
  // tabComplete using plugin from: https://www.jqueryscript.net/form/Simple-jQuery-Tab-Completion-Plugin-Tab-Complete.html

let textarea = chatbox.find(`[class*="chat-box-input"] textarea`);
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
function getNamesInAllChats() {
    $(`#chatRoot div[class*="chat-box_"]`).not(`[class*="chat-box-settings"]`).each(function() {
        getNamesInChatbox($(this));
    })
}
function getNamesInChatbox(chatbox) {
    let title = chatbox.find(`[class*="chat-box-title"]`).attr("title").toLowerCase();
    if (!namesList[title]) {
        namesList[title] = [];
    }

    chatbox.find(`div[class*="overview"] div[class*="message_"] > a`).each(function() {
        let name = $.trim($(this).text()).replace(":", "");
        if (!namesList[title].includes(name)) {
        namesList[title].push(name);
        }
    });

    addTabComplete(chatbox, title);
}


})();