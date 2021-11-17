(function() {

// Case-Insensitive JQuery contains found here https://stackoverflow.com/questions/8746882/jquery-contains-selector-uppercase-and-lower-case-issue
jQuery.expr[':'].icontains = function(a, i, m) {
  return jQuery(a).text().toUpperCase()
      .indexOf(m[3].toUpperCase()) >= 0;
};

//Create Observer for start of Chat Functions - Add Filter Textbox/Check Highlights
const tradeObserver = new MutationObserver(function(mutations) {
  if ($('#chatRoot').length == 1) {
    if ($('div[class^="chat-box"][class*="trade"]').length != 0 && $('input.re_chat_search').length == 0) {
      insertChatSearch();
      tradeObserver.disconnect();
    }
  }
});
const observer = new MutationObserver(function(mutations) {
  if ($('#chatRoot').length == 1) {
    //Start other observers
    const chatRoot = document.getElementById("chatRoot");
    chatobserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
    nameHighlightObserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
    observer.disconnect();
  }
});



//Trade Chat Filter - New Messages (Create Observer)
const chatobserver = new MutationObserver(function(mutations) {
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

//Create highlight Observer
const nameHighlightObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    //new messages
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      if (mutation.addedNodes[0] && mutation.addedNodes[0].className) {
        if (mutation.addedNodes[0].className.includes('message')) {
          highlightAll();
        }
      }
    }
    //opening chatboxes
    if (mutation.target && mutation.target.className) {
      if (mutation.target.className.includes('chat-active')) {
        highlightAll();
      }
    }
  });

  //Already opened chats
  if ($("#chatRoot [class*='chat-active']").length != 0) {
    highlightAll();
  }
});


//Actually Start Observer
tradeObserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
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

function highlightAll() {
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
}


function removeHighlights() {
 $('#chatRoot div[class^="message"] > a').css("color", "");
}

})();
