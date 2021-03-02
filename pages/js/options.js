$("button#test").click(function() {
  chrome.notifications.create(
      "test-notification",
      {
        type: "basic",
        iconUrl: "/images/ReTorn@Default.png",
        title: "ReTorn: This is a notification",
        message: "hello there!",
        contextMessage: "Woah there...",
        buttons: [
          {
          title: "Test Button"
          },
          {
          title: "Epic Button"
          }]
      },
      function (id) {console.log(id)}
    );
});

chrome.runtime.sendMessage({name: "get_value", value: "re_settings"}, (response) => {
  console.log(response);
    if (response.status == true && response.value.re_settings != undefined && response.value.re_settings.darkmode != undefined && response.value.re_settings.darkmode == true) {
      $("html").removeClass('light');
      $("html").addClass('dark');
      $('#darkmode').prop("checked", true);
    } else {
      $("html").removeClass('dark');
      $("html").addClass('light');
      $('#darkmode').prop("checked", false);
    }
});

$(document).ready(function() {

  //$('ul.tabs > li').filter(':not([data-tab="profile"])',':not([data-tab="attributions"])').addClass('disabled');



  $('ul.tabs > li').first().addClass('active');
  $('.tab_container').first().addClass('show');

  $('ul.tabs li:not(.disabled,:disabled)').click(function(){
      var t = $(this).data('tab');

      if($(this).hasClass('active')){

      } else {
        $('ul.tabs > li').removeClass('active');
        $(this).addClass('active');
      }
      $('.tab_container').removeClass('show');
      $('.tab_container#'+ t).addClass('show');
   });


   $('#darkmode').change(function() {
     let v = $(this).is(":checked");
     console.log(v);
     chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"darkmode": v}}, (response) => {
       console.log(response);
          if ($(this).is(':not(:checked)')) {
            $("html").removeClass('dark');
            $("html").addClass('light');

          } else {
            $("html").removeClass('light');
            $("html").addClass('dark');
          }
      });
    });

});
