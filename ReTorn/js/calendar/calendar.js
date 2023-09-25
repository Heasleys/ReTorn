$(document).ready(function() {
  if ($('div.captcha').length == 0) {
    var observer = new MutationObserver(function(mutations) {
      if ($('div[class^="eventTitle"]:contains("Christmas Town")').length == 1) {
        $('div[class^="eventTitle"]:contains("Christmas Town")').replaceWith(`<a class="re_link" href="/christmas_town.php">Christmas Town</a>`);
        observer.disconnect();
      }
    });

    observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
  }
});
