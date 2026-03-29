var apikey = "";

sendMessage({name: "get_local", value: "re_apikey"}).then((r) => {
    if (r.data) apikey = r.data;
})
.catch((e) => console.error(e))

var authorizationObserver = new MutationObserver(function(mutations, observer) {
  if ( $(`#api_key_value`).length == 1 && $(`#api_key_value`).val() == "" && apikey != "" && $(`#re_apikey_holder`).length == 0) {
    $(`.auth-container > form > div > div`).append(`
      <div class="re_auth_wrapper"><label>ReTorn API Key (copy and paste to the textbox below):</label><section class=""><input id="re_apikey_holder" type="text"><span class="confirmation">Copied!</span></section></div>
      `)  
    
    
    
    $(`#re_apikey_holder`).val(apikey);
      $(`#re_apikey_holder`).on('focus', function() {
        $(this).select();
        navigator.clipboard.writeText($(`#re_apikey_holder`).val());
        var confirmation = $(this).parent().find('.confirmation');

        if (!confirmation.is(":visible")) {
          confirmation.toggleClass("copied");
          setTimeout(function(){
            confirmation.toggleClass('copied');
          }, 2000);
        }
      })
  }
});

authorizationObserver.observe(document, OBS_OPTIONS);