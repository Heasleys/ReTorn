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

  //Trade Chat Filter - Add Filter Textbox
  const observer = new MutationObserver(function(mutations) {
    if ($('div[class^="chat-box"][class*="trade"]').length != 0 && $('input.re_chat_search').length == 0) {
      insertChatSearch();
      var chatRoot = document.getElementById("chatRoot");
      chatobserver.observe(chatRoot, {attributes: false, childList: true, characterData: false, subtree:true});
      observer.disconnect();
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

  observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

})();
