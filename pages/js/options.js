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
    if (response.status == true && response.value.re_settings != undefined) {
      if (response.value.re_settings.darkmode != undefined && response.value.re_settings.darkmode == true) {
        $("html").removeClass('light');
        $("html").addClass('dark');
        $('#darkmode').prop("checked", true);
      } else {
        $("html").removeClass('dark');
        $("html").addClass('light');
        $('#darkmode').prop("checked", false);
      }

      if (response.value.re_settings.tornstats != undefined && response.value.re_settings.tornstats == true) {
        $('#ts_status').text("Enabled");
        $('button#tornstats').html("Unlink account");
        $('button#tornstats').val(1);
      } else {
        $('#ts_status').text("Disabled");
        $('button#tornstats').html("Link account");
        $('button#tornstats').val(0);
      }
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

    $("button#tornstats").click(function() {
      if ($(this).val() == 0) {
        chrome.runtime.sendMessage({name: "integrate_tornstats"}, (response) => {
          console.log(response);
          if (response.status != undefined) {
            message(response, "ts_message", response.status);
            if (response.status == true) {
              $('#ts_status').text("Enabled");
              $(this).html("Unlink account");
              $('button#tornstats').val(1);
            } else {
              $('#ts_status').text("Disabled");
              $(this).html("Link account");
              $('button#tornstats').val(0);
            }
          } else {
            message("Unknown error.", "ts_message", false);
          }
        });
      }
      if ($(this).val() == 1) {
        chrome.runtime.sendMessage({name: "set_value", value_name: "re_settings", value: {"tornstats": false}}, (response) => {
          message(response, "ts_message", response.status);
          if (response.status == true) {
            $('#ts_status').text("Disabled");
            $(this).html("Link account");
            $('button#tornstats').val(0);
          } else {
            $('#ts_status').text("Enabled");
            $(this).html("Unlink account");
            $('button#tornstats').val(1);
          }
        });
      }
    });


    function message(response, me, status) {
      if (status == false) {
        $(".re_message#"+me).removeClass('success');
        $(".re_message#"+me).addClass('error');
      } else {
        $(".re_message#"+me).removeClass('error');
        $(".re_message#"+me).addClass('success');
      }
      if (response.value != undefined) {
        $(".re_message#"+me).text(response.message + " {" + response.value + "}");
      } else {
        $(".re_message#"+me).text(response.message);
      }
      $(".re_message#"+me).attr('hidden', false);
    }
});
