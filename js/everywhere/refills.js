$(document).ready(function() {
  var data;
  const target = document.getElementById("sidebarroot");
  const obsOptions = {attributes: false, childList: true, characterData: false, subtree:true};

  const observer = new MutationObserver(function(mutations) {
    if (!$('#re_nerve').length > 0 || !$('#re_energy').length > 0) {
      setRefills();
      observer.disconnect();
    }
  });

  chrome.runtime.sendMessage({name: "get_value", value: "re_user_data", type: "local"}, (response) => {
    if (response && response.value && response.value.re_user_data) {
      data = response.value.re_user_data;
      setRefills();
      observer.observe(target, obsOptions);
    }
  });

function setRefills() {
  if (data.refills) {
    if (data.refills.energy_refill_used != undefined && data.refills.energy_refill_used == false) {
      $("#barEnergy").find("p[class^='bar-name']").wrap('<a class="re_refill" id="re_energy" href="/points.php"></a>');
      $("div[class^='bars-mobile'] #barEnergy").find("p[class^='bar-value']").wrap('<a class="re_refill" id="re_energy" href="/points.php"></a>');
    }

    if (data.refills.nerve_refill_used != undefined && data.refills.nerve_refill_used == false) {
      $("#barNerve").find("p[class^='bar-name']").wrap('<a class="re_refill" id="re_nerve" href="/points.php"></a>');
      $("div[class^='bars-mobile'] #barNerve").find("p[class^='bar-value']").wrap('<a class="re_refill" id="re_nerve" href="/points.php"></a>');
    }

    $('.re_refill').off('click').click(function(e) {
      window.location = $(this).prop('href');
    });
  }
}

});
