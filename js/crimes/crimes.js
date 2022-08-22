// @version      1.0.0
// @description  Add quick crimes
// @author       Heasleys4hemp [1468764]
if ($('div.captcha').length == 0 && $('div.content-wrapper.logged-out').length == 0) {
  var timeToCrime;
  var n = 1;
  var url = window.location.href;
  insertHeader($("div.content-title"), 'after', 'quick_crimes');
  if (url.includes("?step=docrime")) {
    insertHeader($("div.content-wrapper"), 'prepend', 'quick_crimes');
  }
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
                  const obj = {
                    quick_crimes: {
                      [cval]: {
                        order: n, 
                        nerve: nval,
                        crime: cval, 
                        text: ctext, 
                        action: action, 
                        img: imgURL
                      }
                    }
                  }
                  sendMessage({"name": "merge_sync", "key": "settings", "object": obj})
                  .then((r) => {
                    reloadCrimes();
                  })
                  .catch((e) => console.error(e))
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
  sendMessage({name: "get_sync", value: "settings"})
  .then((r) => {
    if (r?.status) {
      if (r?.data?.quick_crimes != undefined) {
          $('#re_quick_crimes').empty();
          const crimes = r?.data?.quick_crimes;
          let x = 0;
          Object.entries(crimes).forEach(([index, crime]) => {
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

              sendMessage({"name": "delete_settings_key", "item": "quick_crimes", "key": cval})
              .then((r) => {
                reloadCrimes();
              })
              .catch((e) => console.error(e))
            });

          });
          re_container = $('div.re_container').clone(true, true);
          n = x;
          n++;
      }
    }
  })
  .catch((e) => console.error(e))
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
