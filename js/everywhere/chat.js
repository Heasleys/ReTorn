(function() {
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

  //Start Chat Functions - Add Filter Textbox/Check Highlights
  const observer = new MutationObserver(function(mutations) {
    if ($('div[class^="chat-box"][class*="trade"]').length != 0 && $('input.re_chat_search').length == 0 && $('#chatRoot').length == 1) {
      insertChatSearch();
      let chatRoot = document.getElementById("chatRoot");
      chatobserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
    }
    if ($('#chatRoot').length == 1) {
      nameHighlight();
    }
  });

  //Trade Chat Filter - New Messages
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


  const nameHighlightObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      console.log(mutation);
      //new messages
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        if (mutation.addedNodes[0] && mutation.addedNodes[0].className) {
          if (mutation.addedNodes[0].className.includes('message')) {
            highlightAllNames();
          }
        }
      }
      //opening chatboxes
      if (mutation.target && mutation.target.className) {
        if (mutation.target.className.includes('chat-active')) {
          highlightAllNames();
        }
      }
    });
  });


  observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});


 function nameHighlight() {
   chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (res) => {
     if (res.status && res.status == true) {
       if (res.value.re_settings) {
         let settings = res.value.re_settings;
         if (settings && settings.chatuserhighlight != undefined && settings.chatuserhighlight == true) {
           var chatRoot = document.getElementById("chatRoot");
           highlightAllNames();
           nameHighlightObserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
         } else {
           removeHighlights();
         }
       }
     }
   });
 }

 function highlightAllNames() {
   chrome.runtime.sendMessage({name: "get_value", value: "re_chatuserhighlight"}, (response) => {
     console.log(response);
     if (response.status && response.status == true && response.value) {
       if (response.value.re_chatuserhighlight && !jQuery.isEmptyObject(response.value.re_chatuserhighlight)) {
         var userHighlights = response.value.re_chatuserhighlight;
         Object.keys(userHighlights).forEach(userid => {
           if (userHighlights[userid].enabled) {
              $('#chatRoot div[class^="message"] > a[href="/profiles.php?XID='+userid+'"]').css("color", userHighlights[userid].color);
           } else {
             $('#chatRoot div[class^="message"] > a[href="/profiles.php?XID='+userid+'"]').css("color", "");
           }
         });
       }
     }
   });
  }

 function removeHighlights() {
   $('#chatRoot div[class^="message"] > a').css("color", "");
 }

})();
