var data;
(function() {
  if (features?.general?.refill_reminder?.enabled) {
    sendMessage({name: "get_local", value: "re_user_data"})
    .then((r) => {
      data = r.data?.refills;
      setRefills();
    })
    .catch((e) => console.error(e));
    //click event for new refill links
    $(document).on('click', '.re_refill', function(event){
      window.location = $(this).prop('href');
    });
  }
})();


function setRefills() {
    if (data?.energy_refill_used == false) {
      $("#barEnergy").find("p[class^='bar-name']").wrap('<a class="re_refill" id="re_energy" href="/points.php"></a>');
      $("div[class^='bars-mobile'] #barEnergy").find("p[class^='bar-value']").wrap('<a class="re_refill" id="re_energy" href="/points.php"></a>');
    }

    if (data?.nerve_refill_used == false) {
      $("#barNerve").find("p[class^='bar-name']").wrap('<a class="re_refill" id="re_nerve" href="/points.php"></a>');
      $("div[class^='bars-mobile'] #barNerve").find("p[class^='bar-value']").wrap('<a class="re_refill" id="re_nerve" href="/points.php"></a>');
    }
}


