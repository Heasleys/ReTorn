var ajaxI;

$( document ).ajaxComplete(function( event, request, settings ) {
    console.log(request);
    //make api response body collapsable
    $('div > span > h4').each(function() {
        const pre = $(this).next();
        const a = '<a data-toggle="collapse" href="#selection_' + ajaxI + '" aria-expanded="false" aria-controls="selection_' + ajaxI + '" class="collapsed"></a>';
        const d = '<div id="selection_' + ajaxI + '" class="panel-collapse in" role="tabpanel" aria-labelledby="selection_' + ajaxI + '"></div>';
        $(this).wrap(a);
        pre.wrap(d);
        ajaxI++;
    });

    $('.panel-body p[class*="_fields"] small').each(function() {
        const ogText = $(this).text().toLowerCase();
        const fieldsText = ogText.replace("available fields: ", "");
        if (fieldsText != "") {
            const newFields = fieldsText.split(",").map(function (v) {
                const string = v.trim();
                return `<span class="re_field" data-field="${string}">${string}</span>`;
            });
            const fieldsHTML = `<strong>Available fields: </strong>` + newFields.join(', ');
            $(this).html(fieldsHTML);
        }
    })
});