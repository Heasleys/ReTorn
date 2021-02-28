$("button#test").click(function() {
  chrome.runtime.sendMessage({name: "alarm_test"});
});
