(function() {
  var data;

  const observerObserver = new MutationObserver(function(mutations) {
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i]?.target?.id == "mainContainer" && mutations[i]?.addedNodes?.length) {
        for (let a = 0; a < mutations[i].addedNodes.length; a++) {
          if (mutations[i].addedNodes[a].id == "sidebarroot") {
              const target = document.getElementById('sidebarroot');
              refillObserver.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});
              observerObserver.disconnect();
          }
        }
      }
    }
  });

  const refillObserver = new MutationObserver(function(mutations) {
    if ($(`#sidebar [class*="bar_"][class*="energy_"]`).length && $(`#sidebar [class*="bar_"][class*="nerve_"]`).length && !document.getElementsByClassName('re_refill').length) {
      setRefills();
      refillObserver.disconnect();
    }
  });

  //click event for new refill links
  $(document).on('click', '.re_refill', function(event){
    window.location = $(this).prop('href');
  });

  sendMessage({name: "get_local", value: "re_user_data"})
  .then((r) => {
    data = r.data?.refills;
    const target = document;
    const obsOptions = {attributes: false, childList: true, characterData: false, subtree:true};
    observerObserver.observe(target, obsOptions);
  })
  .catch((e) => console.error(e));


  function setRefills() {
    if (features?.general?.refill_reminder?.enabled) {
      if (data?.energy_refill_used == false) {
        $(`#sidebar [class*="bar_"][class*="energy_"]`).find("p[class^='bar-name']").wrap('<a class="re_refill" id="re_energy" href="/points.php"></a>');
        $(`div[class*="bars-mobile"] [class*="bar_"][class*="energy_"]`).find("p[class*='bar-value']").wrap('<a class="re_refill" id="re_energy" href="/points.php"></a>');
      }

      if (data?.nerve_refill_used == false) {
        $(`#sidebar [class*="bar_"][class*="nerve_"]`).find("p[class^='bar-name']").wrap('<a class="re_refill" id="re_nerve" href="/points.php"></a>');
        $(`div[class^='bars-mobile'] [class*="bar_"][class*="nerve_"]`).find("p[class^='bar-value']").wrap('<a class="re_refill" id="re_nerve" href="/points.php"></a>');
      }
    }
  }
})();


