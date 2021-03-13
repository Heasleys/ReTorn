// @version      1.0.0
// @description  Add quick crimes
// @author       Heasleys4hemp [1468764]
if ($('div.captcha').length == 0) {
  var timeToCrime;
  var n = 1;
  insertHeader();

  function insertHeader() {
    if ($('div.re_container').length == 0) {
      $("div.content-title").after(`
      <div class="re_container">
        <div class="re_head expanded">
          <span class="re_title">ReTorn: Quick Crimes</span>
            <div class="re_icon_wrap">
              <span class="re_icon arrow_down">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32"><path d=""></path></svg>
              </span>
            </div>
        </div>

        <div class="re_content">

            <p>Click on a crime's image to add it to this quick crimes list.</p>

          <div class="re_row" id="re_quick_crimes">


          </div>
        </div>
      </div>
      `);

      $(".re_head").click(function() {
          $(this).toggleClass("expanded");
          $("div.re_content").slideToggle("fast");

          $("div.re_icon_wrap > span.re_icon").toggleClass("arrow_right arrow_down");
      });

      $("#re_quick_crimes > div").click(function() {
        $(this).find('form').submit();
      });

      reloadCrimes();
    }
  }

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        insertHeader();
        for (var i = 0; i < mutation.addedNodes.length; i++) {
          if (mutation.addedNodes[i].classList && mutation.addedNodes[i].classList[0] == "specials-cont-wrap") {
            if ($('div.specials-cont-wrap > form[name="crimes"]:not([action="crimes.php?step=docrime"])').length > 0) {
              var form = $('div.specials-cont-wrap > form[name="crimes"]:not([action="crimes.php?step=docrime"]):not([action="crimes.php?step=docrime3"])');
              var nval = form.find('input[name="nervetake"]').val();
              var action = form.attr("action");
              form.find('li.title > img').each(function() {
                var item = $(this).parent().parent();
                var ctext = item.find("li.bonus").text();
                var cval = item.find("li.radio").find("input[type='radio'][name='crime']").val();
                var imgURL = $(this).attr("src");

                var buttonWrap = $('<button/>');
                buttonWrap.addClass('re_add_qcrime');
                buttonWrap.attr('title', 'Add to Quick Crimes');
                buttonWrap.data('nval', nval);
                buttonWrap.data('cval', cval);
                buttonWrap.data('ctext', ctext);
                buttonWrap.data('img', imgURL);
                buttonWrap.data('action', action);
                $(this).wrap(buttonWrap);
              });

              $(".re_add_qcrime").off('click').click(function (event) {
                event.stopPropagation();
                event.preventDefault();

                var ctext = $(this).data("ctext");
                var cval = $(this).data("cval");
                var nval = $(this).data("nval");
                var imgURL = $(this).data("img");
                var action = $(this).data("action");

                if ($('#re_quick_crimes').find('input[name="crime"][value="'+cval+'"]').length == 0) {
                  chrome.runtime.sendMessage({name: "set_value", value_name: "re_qcrimes", value: {crimes: {[cval]: {order: n, nerve: nval, crime: cval, text: ctext, action: action, img: imgURL}}}}, (response) => {
                    reloadCrimes();
                  });
                }
              });
            }
          }
        }
      }
    })
  });

var target = document.querySelector('div.content-wrapper');
observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});


var crimesContentWrapper = $('.content-wrapper');
var loadingPlaceholderContent = '<div class="content-title m-bottom10"><h4 class="left">Crimes</h4>\n' + '    <div class="clear"></div>\n' + '    <hr class="page-head-delimiter">\n' + '</div> <img class="ajax-placeholder" src="/images/v2/main/ajax-loader.gif"/>';
crimesContentWrapper.off("submit");
crimesContentWrapper.on('submit', 'form', function(event) {
    var formElement = this;
    var $form = $(formElement);
    if (formElement.isSubmitting) {return;}
    formElement.isSubmitting = true;
    event.preventDefault();
    var data = $form.serializeArray();
    window.location.hash = "#";
    crimesContentWrapper.html(loadingPlaceholderContent);

    var action = $form.attr('action');
    action = action[0] == '/' ? action.substr(1) : action;
    var urlParamsDelimier = action.indexOf('?') > -1 ? '&' : '?'
    action += urlParamsDelimier + 'timestamp=' + Date.now();

      $.ajax({
        url: action,
        method: 'POST',
        data: data
      })
      .done(function(resp) {
        formElement.isSubmitting = false;
        const REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
        var sc = resp.match(REGEX);

        var noScripts = resp.replace(REGEX, '');
        crimesContentWrapper.html(noScripts);

        if (sc && sc.length != 0) {
          var num = sc[0].match(/\d+/g);
          clearInterval(timeToCrime);
          timeToCrime = setInterval(function() {
            timeDisplay = secondsToDhms(num);
            if (timeDisplay == "") {timeDisplay = "0s"}
            $("#defaultCountdown").html(timeDisplay);
            num--;
          }, 1000);
        }
      })
      .fail(function(ee) {
        console.error(ee)
      })

});

}

function reloadCrimes() {
  chrome.runtime.sendMessage({name: "get_value", value: "re_qcrimes"}, (response) => {

    if (response.status && response.status == true) {
      if (response.value && response.value.re_qcrimes && response.value.re_qcrimes.crimes) {
          $('#re_quick_crimes').empty();
          var crimes = response.value.re_qcrimes.crimes;
          let x = 0;
          $.each(crimes, (index, crime) => {
            x++;
            $('#re_quick_crimes').prepend(`
              <div style="order: `+crime.order+`"><form action="`+crime.action+`" method="post" name="crimes">
                <input name="nervetake" type="hidden" value="`+crime.nerve+`">
                <input name="crime" type="hidden" value="`+crime.crime+`">
                  <span>
                  <button class="re_del_qcrime" data-cval="`+crime.crime+`">
                    <img width="30" height="30" src="`+crime.img+`">
                  </button>
                    `+crime.text+` (-`+crime.nerve+` Nerve)
                  </span>
              </form></div>
            `);
            $("#re_quick_crimes > div").click(function() {
              $(this).find('form').submit();
            });

            $(".re_del_qcrime").off('click').click(function (event) {
              event.stopPropagation();
              event.preventDefault();
              var cval = $(this).data('cval');

              chrome.runtime.sendMessage({name: "del_value", value: "re_qcrimes", key: cval}, (response) => {
                if (response && response.status && response.status == true) {
                  reloadCrimes();
                }
              });

            });

          });
          n = x;
          n++;
      }
    }



  });
}

function secondsToDhms(seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600*24));
  var h = Math.floor(seconds % (3600*24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);

  var dDisplay = d > 0 ? d + (d == 1 ? "d " : "d ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? "h " : "h ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? "m " : "m ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? "s" : "s") : "";

  let display = dDisplay + hDisplay + mDisplay + sDisplay;
  return display;
}
