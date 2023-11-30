const target = document.querySelector('.content-wrapper');
const obsOptions = {attributes: false, childList: true, characterData: false, subtree:true};

var displaycaseObserver = new MutationObserver(function(mutations, observer) {
    if (features?.pages?.displaycase?.case_management?.enabled && $('ul.dc-list').length == 1 && $('ul.dc-list.re_dc_management').length == 0) {
        add_dc_management();
        displaycaseObserver.disconnect();
    }
  });


urlHandler();
window.addEventListener('hashchange', hashHandler, false);

function hashHandler() {
  var hash = location.hash;
  if (hash.includes('manage')) {
     urlHandler();
  }
}

function urlHandler() {
    let url = location.href;
    if (url.includes('manage') && features?.pages?.displaycase?.case_management?.enabled) {
       displaycaseObserver.observe(target, obsOptions);
    } else {
        displaycaseObserver.disconnect();
    }
}


function add_dc_management() {
    const dc_list = $('ul.dc-list');
    if (!dc_list.length) return;

    const move_up = `<div class="re_move_up"><i></i></div>`;
    const move_down = `<div class="re_move_down"><i></i></div>`;

    dc_list.find('li > .name > .draggable-wrap').each(function() {
        $(this).after(move_down);
        $(this).after(move_up);
    });

    dc_list.addClass("re_dc_management");


    $('.re_dc_management .re_move_up').click(function() {
        const li = $(this).closest('li[itemid]');
        li.prependTo(dc_list);
    })

    $('.re_dc_management .re_move_down').click(function() {
        const li = $(this).closest('li[itemid]');
        li.appendTo(dc_list);
    })

}