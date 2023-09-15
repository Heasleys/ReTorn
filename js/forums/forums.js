(function() {
  var blocked_users = settings?.forums?.blocked_users;
  var player_id;

  sendMessage({name: "get_local", value: "re_user"})
  .then((r) => {
    if (!r?.status && !r?.data?.re_user?.player_id) {
      throw "[ReTorn][Block Users] Error: " + r?.message;
    }
    player_id = r?.data?.re_user?.player_id;
  })
  .catch((e) => console.error(e));

  var observer = new MutationObserver(function(mutations, observer) {
    mutations.forEach(function(mutation) {
      if (mutation.target && mutation.target && mutation.target.id && mutation.target.id == "forums-page-wrap") {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          if (features?.pages?.forums?.discord_copy?.enabled) {
            insert_discord_buttons();
          }
          if (features?.pages?.forums?.blocked_users?.enabled) {
            block_users();
            insert_block_list();
          }
          
        }
      }
    });
  });
  

  function hash_handler() {
    var hash = location.hash;
    if (hash) {
      url_handler();
    }
  }

  function url_handler() {
    let url = location.href;

    if (url.includes("#/p=main") || url == "https://www.torn.com/forums.php") {
      insert_block_list();
    }
  }

  window.addEventListener('hashchange', hash_handler, false);
  url_handler();

  if (features?.pages?.forums?.discord_copy?.enabled) {
    insert_discord_buttons();
  }
  if (features?.pages?.forums?.blocked_users?.enabled) { //add block features
    block_users();
  }
  const target = document.querySelector('div.content-wrapper');
  observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});


function insert_discord_buttons() {
  if (!$('ul.thread-list > li ul.action-wrap').length) return;

  $('ul.thread-list > li ul.action-wrap').each(function() {
    if ($(this).find('.re_discord').length == 0) {
      $(this).find('li.right-part').before(`
        <li class="re_discord forum-button" title="Copy post for Discord">
        <i class="re_discord_icon white"></i>
        <span class="button-text">Discord</span>
        <span class="confirmation">Copied!</span>
        </li>
      `);
    }
  });
  //used as an identifier for css
  $('.content-wrapper').addClass('re_discord_copy');

  $(".re_discord").click(function(e) {
    e.preventDefault();
    e.stopPropagation();
    let discordFormat = "";
    let codeblock = "```";
    let quote = "";

    let forum_wrap = $(this).closest(".column-wrap");
    let forum_title = $("#topic-title").text().replace(/(\r\n|\n|\r)/gm, "").replace(/\s\s+/g, ' ');
    let post_id = "&to=" + forum_wrap.find('.post-wrap').attr("data-post");
    let forum_url = window.location.toString().replace(/\&to=\d*/g, "") + post_id;


    let likes = parseInt(forum_wrap.find(".like > span.value").text().replace(/\s/g, ""));
    let dislikes = parseInt(forum_wrap.find(".dislike > span.value").text().replace(/\s/g, ""));

    likes = isNaN(likes) ? '0' : likes.toLocaleString('en-US');
    dislikes = isNaN(dislikes) ? '0' : dislikes.toLocaleString('en-US') ;


    let poster_wrap = forum_wrap.find(".poster-wrap");
    let author = poster_wrap.find('.name-id').length ? poster_wrap.find('.name-id').text().trim() : "Author";
    author = author.replace(/\s\s+/g, ' ');

    let post_container = forum_wrap.find(".post-container");
    let text = post_container.children('.origin-post-content').text();

    let formattedText = text.replace(/\[\/?(?:quote|code|img|color|size|li|ul|center|right|left|justify|background|b|i|s)+?.*?\]|\[\/?(?:u)\]/img, "");

    let timestamp = post_container.find('.time-wrap > div:first-child').text();

    //Check for quote
    if (post_container.children(".quote").length > 0) {
      let quote_wrap = post_container.find(".quote > .post-quote");
      let last_quote_author = quote_wrap.children(".author-quote").find("a").text();
      let last_quote_text = quote_wrap.children(".quote-post").children(".quote-post-content").text();

      //if quote is too big, cut it off after 500 characters
      if (last_quote_text.length > 500) {
        last_quote_text = last_quote_text.substring(0, 500) + "...";
      }
      quote = `> ${last_quote_author}:\n> ${last_quote_text}\n\n`;
    }

    //if text is too big, cut it off
    if (formattedText.length > (1700 - quote.length)) {
      let max = (1700 - quote.length);
      formattedText = formattedText.substring(0, max) + "...";
    }

    //Extract any URLs to add to bottom of Discord post
    var urls = text.match(/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/igm);

    //Title for discord format
    discordFormat = `:speech_left: **${forum_title}** ${forum_url}\n${codeblock}diff\n--- ${timestamp}\n+ ${likes} upvotes\n- ${dislikes} downvotes\n${codeblock}\n`;

    //content
    discordFormat += `**${author}**:\n${codeblock}md\n${quote}${formattedText}\n${codeblock}`;

    if (urls && urls.length > 0) {
      discordFormat += `\n`;
      urls.forEach((url,index) => {
        index++;
        discordFormat += `${index}: ${url}\n`;
      })
    }

    copy_internal(discordFormat);
    var confirmation = $(this).find('.confirmation');

    if (!confirmation.is(":visible")) {
      confirmation.toggleClass("copied");
      setTimeout(function(){
        confirmation.toggleClass('copied');
      }, 2000);
    }

  });

}
//copy to clipboard function taken from internet -> https://pastebin.com/ikVzSiq9
async function copy_internal(text) {
  if (!navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  // fall back if clipboard api does not exist
  let textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}

function insert_block_buttons() {
  if (!$('ul.thread-list > li div.poster-wrap').length) return;

  $('ul.thread-list > li div.poster-wrap').each(function() {
    if ($(this).find('.re_block_user_wrap').length == 0) {
      $(this).find('.info-wrap').append(`
        <div class="re_block_user_wrap">
          <li class="re_block forum-button" title="Block user's forum posts">
            <i class="fa-solid fa-user-slash"></i>
            <span class="button-text">Block</span>
          </li>
        </div>
      `);
    }
  });
  //used as an identifier for css
  $('.content-wrapper').addClass('re_block_users');

  //click event
  $('.re_block_user_wrap .re_block').click(function() {
    var name = $(this).closest('.poster-wrap').find('.name-id .poster-name').text();
    var id = parseInt($(this).closest('.poster-wrap').find('.name-id .poster-id').text().replace(/\D/g, ''));
    
    if (name && id && id != player_id) {
      blocked_users[id] = {"name": name}


      const obj = {
        "forums": {
          "blocked_users": {
            [id]: {
              "name": name
            }
          }
        }
      }

      sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
      .then(block_users())
      .catch((e) => console.error(e));
    }
  });
}

function insert_block_list() {
  if (!$('#forums-page-wrap #updates').length || $('#blocked_list').length) return;

  var active = "";
  var expanded = "";
  if (settings?.forums?.blocked_users_dashboard?.expanded) {
    active = "active";
    expanded = 'style="display: block;"';
  } else {
    expanded = 'style="display: none;"';
  }

  const block_list_html = `
            <hr class="delimiter-999 m-top10 m-bottom10">
            <div class="dashboard re_block_list">
              <div class="title-black title-toggle ${active}" role="heading" aria-level="7">
                <i class="arrow"></i>
                Blocked Users
              </div>
              <div class="bottom-round panel-scrollbar scrollbar-bright" ${expanded}>
                <ul class="panel fm-list" id="blocked_list")>
                </ul>
              </div>
            </div>
  `;

  $('#updates > .update-wrap').append(block_list_html);

  var blocked_users_html = "";

  if (blocked_users && Object.keys(blocked_users).length) {
    for (const [key, value] of Object.entries(blocked_users)) {
      user_id = key;
      username = value.name;
    
      var blocked_user = `<li>
      <div class="re_icons_wrap"><a class="re_unblock_user" data-id="${user_id}"><i></i></a></div>
      <div class="re_post_wrap">
          <div class="bold t-overflow"><a href="profiles.php?XID=${user_id}" target="_blank">${username} [${user_id}]</a></div>
      </div>
      </li>`;

      blocked_users_html += blocked_user;
    }
  } else {
    blocked_users_html = no_blocked_users_html;
  }


  //insert blocked users into block list
  $('#blocked_list').append(`${blocked_users_html}`);


  $('.re_block_list > div.title-toggle').click(function() {
    var expanded = !$(this).hasClass('active');
    const obj = {
      "forums": {
        "blocked_users_dashboard": {
          "expanded": expanded
        }
      }
    }
    settings.forums.blocked_users_dashboard.expanded = expanded;
    sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
    .catch((e) => console.error(e));
  });

  $('.re_unblock_user').click(function() {
    const id = parseInt($(this).attr('data-id'));

    sendMessage({"name": "delete_multi_nested_key", "object_key": "settings", "keys": ["forums", "blocked_users", id], "location": "sync"})
    .then((r) => {
      $(this).closest('li').remove();
      delete blocked_users[id];

      if (Object.keys(blocked_users).length == 0) {
        $('#blocked_list').html(no_blocked_users_html);
      }
    })
    .catch((e) => console.error(e))
  });
}

function block_users() {
  if (!jQuery.isEmptyObject(blocked_users)) {
    var thread_posts = $('ul.thread-list > li');
    var quote_posts = $('div.quote blockquote:not(.re_blocked_quote)');
    if (thread_posts.length) {
      thread_posts.each(function() {
        var post = $(this);
        var id = parseInt($(this).find('.poster-wrap .info-wrap .name-id .poster-id').text().replace(/\D/g, ''));

        if (blocked_users[id]) {
          post.hide();
        }
      });
    }
    if (quote_posts.length) {
      quote_posts.each(function() {
        var quote = $(this);
        var author_block = quote.children('.author-quote');
        var message_block = quote.children('.quote-post');

        const author = parseInt(author_block.find('a').attr('href').replace(/\D/g, ''));
        if (blocked_users[author]) {
          quote.addClass('re_blocked_quote');
          author_block.html(`<strong><span class="t-blue h re_blocked_content_button" title="Show content">BLOCKED USER</span></strong>`);
          message_block.addClass('re_blocked_content').addClass('re_hide');
        }
      });

      $('.re_blocked_content_button').off("click").on("click", function() {
        var blocked_content = $(this).closest('.author-quote').siblings('.re_blocked_content');
        blocked_content.toggleClass('re_hide').toggleClass('re_show');
      });
    }
  }
  insert_block_buttons();
}
})();


const no_blocked_users_html = `
<li>
  <div class="re_post_wrap">
      <div class="bold t-overflow">You do not have anyone blocked.</div>
  </div>
</li>
`;