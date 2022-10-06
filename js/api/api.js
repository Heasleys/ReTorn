// @description  Add API key to API key textbox, auto start on try it page,

const sendMessage = (msg) => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (data) => {
      return resolve(data);
    });
  });
};

Promise.all([sendMessage({name: "get_sync", value: "features"}), sendMessage({name: "get_local", value: "re_apikey"})])
.then((r) => {
  const features = r[0].data;

  if (features?.pages?.api?.autofill_api?.enabled) {
    $('#documentation').hide();
    $('#demo').show();
    $('input[type=radio][value=pretty]').each(function(i,e) {
      $(this).prop("checked", true);
    });

    if (r[1].status) {
      $('input#api_key').val(r[1].data);
      $('input#api_key').focus();
    }

    /* Inject AjaxComplete into page */
    var ss = document.createElement("script");
    ss.src = chrome.runtime.getURL("/js/api/apiAjaxComplete.js");
    (document.head || document.documentElement).appendChild(ss);


    $(document).on('click', '.re_field', function(e){
      const field = $(this).data('field');
      const selectionInput = $(this).closest('div.panel-body').find('.form-inline input[name*="_selections"]');
      const v = selectionInput.val();
      if (e.ctrlKey && v != "") {
        selectionInput.val(v + "," + field);
      } else {
        selectionInput.val(field);
      }
    });
  }
})
.catch((e) => console.error(e))