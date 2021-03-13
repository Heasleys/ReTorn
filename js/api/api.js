// @version      1.0.0
// @description  Add API key to API key textbox, auto start on try it page,
// @author       Heasleys4hemp [1468764]
var i = 0;
$('#documentation').hide();
$('#demo').show();
$('input[type=radio][value=pretty]').each(function(i,e) {
  $(this).prop("checked", true);
});

chrome.runtime.sendMessage({name: "get_value", value: "re_api_key"}, (response) => {
  if (response.status != undefined) {
    if (response.status == true) {
      $('input#api_key').val(response.value.re_api_key);
      $('input#api_key').focus();
    }
  }
});

$( document ).ajaxComplete(function( event, request, settings ) {
        console.log(request.responseText);
        $('div > span > h4').each(function() {
            let pre = $(this).next();

            let a = '<a data-toggle="collapse" href="#selection_' + i + '" aria-expanded="false" aria-controls="selection_' + i + '" class="collapsed"></a>';
            let d = '<div id="selection_' + i + '" class="panel-collapse in" role="tabpanel" aria-labelledby="selection_' + i + '"></div>';

            $(this).wrap(a);
            pre.wrap(d);

            i++;
        });
});

$( document ).ajaxComplete(function(event, request, settings) {
  alert("AJAX");
});
