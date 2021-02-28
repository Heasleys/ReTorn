$("button#re_sign_in").click(function() {
  alert("Test");
});

$("button#re_options").click(function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('pages/options.html'));
  }
});
