(function() {
insertDiscordButtons();
  var observer = new MutationObserver(function(mutations, observer) {
    mutations.forEach(function(mutation) {
      if (mutation.target && mutation.target && mutation.target.id && mutation.target.id == "forums-page-wrap") {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {

          insertDiscordButtons();

        }
      }
    });
  });

  const target = document.querySelector('div.content-wrapper');
  observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});


function insertDiscordButtons() {
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

  $(".re_discord").click(function(e) {
    e.preventDefault();
    e.stopPropagation();
    let discordFormat = "";
    let codeblock = "```";
    let quote = "";

    let forum_wrap = $(this).closest(".column-wrap");
    let forum_title = $("#topic-title").text().replace(/(\r\n|\n|\r)/gm, "");
    let post_id = "&to=" + forum_wrap.find('.post-wrap').attr("data-post");
    let forum_url = window.location.toString().replace(/\&to=\d*/g, "") + post_id;


    let likes = parseInt(forum_wrap.find(".like > span.value").text().replace(/\s/g, ""));
    let dislikes = parseInt(forum_wrap.find(".dislike > span.value").text().replace(/\s/g, ""));

    likes = isNaN(likes) ? '0' : likes.toLocaleString('en-US');
    dislikes = isNaN(dislikes) ? '0' : dislikes.toLocaleString('en-US') ;


    let poster_wrap = forum_wrap.find(".poster-wrap");
    let author = poster_wrap.find('.user.name.t-hide > span').prop("title");

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


})();
