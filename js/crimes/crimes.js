// @version      1.0.0
// @description  Add quick crimes
// @author       Heasleys4hemp [1468764]
if ($('div.captcha').length == 0 && $('div.content-wrapper.logged-out').length == 0) {
  var timeToCrime;
  var n = 1;
  var url = window.location.href;
  insertHeader($("div.content-title"), 'after');
  if (url.includes("?step=docrime")) {
    insertHeader($("div.content-wrapper"), 'prepend');
  }

  $('#re_title').text("Quick Crimes");
  $('.re_head .re_title').after(`<span class="re_settings_icon"><i class="fas fa-gear" id="re_settings" title="Toggle settings view"></i></span>`);
  $('.re_content').html(`
    <p>Click on a crime's image to add it to this quick crimes list. Click the image in this list to remove it.</p>
    <div class="re_row" id="re_quick_crimes"></div>
    `);
  reloadCrimes();
  var re_container = $('div.re_container');
  $(".re_head").click(function() {
    re_container = $('div.re_container');
  });




  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        if ($('div.re_container').length == 0) {$("div.content-title").after(re_container);};
        for (const element of mutation.addedNodes) {
          if (element.classList && element.classList[0] == "specials-cont-wrap") {
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

                checkSafeCrime(item);
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
        }//for
      }
    })
  });

var target = document.querySelector('div.content-wrapper');
observer.observe(target, {attributes: false, childList: true, characterData: false, subtree:true});

}//if captcha

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
              <form action="`+crime.action+`" method="post" name="crimes" style="order: `+crime.order+`">
                <div class="re_button" id="do_crimes">
                  <input name="nervetake" type="hidden" value="`+crime.nerve+`">
                  <input name="crime" type="hidden" value="`+crime.crime+`">
                  <span>
                    <button class="re_del_qcrime" data-cval="`+crime.crime+`">
                      <img width="30" height="30" src="`+crime.img+`">
                    </button>
                      `+crime.text+` (-`+crime.nerve+` Nerve)
                  </span>
                </div>
              </form>
            `);

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
          re_container = $('div.re_container').clone(true, true);
          n = x;
          n++;
      }
    }



  });
}

function checkSafeCrime(item) {
  let crime = item.find("li.bonus").text().toLowerCase().replace(/\s/g,'');
  let safeCrime = false;

  if (crime == "jacket" || crime == "thoroughrobbery" || crime == "stealthvirus" || crime == "mobboss" || crime == "warehouse" || crime == "stealaparkedcar") {
    safeCrime = true;
  }

  if (safeCrime) {
    item.find("li.bonus").append(`<span class="re_safe" title="Safe Crime">✔️<span>`);
  }
}
