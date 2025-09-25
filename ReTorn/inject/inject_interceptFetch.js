//React injection to update State https://stackoverflow.com/questions/57618119/is-it-possible-to-write-a-script-to-inject-props-on-a-react-component ; https://stackoverflow.com/questions/44829051/reactjs-object-doesnt-have-key-reactinternalinstance
function reUpdateState(domElement, newState) {
    var keys = Object.keys(domElement);
    var instanceKey = keys.filter(prop =>
        /__reactFiber/.test(prop)
    )[0];
    var instance = domElement[instanceKey];

    for (var state in newState) {
        if (newState.hasOwnProperty(state)) {
        instance.return.stateNode.state[state] = newState[state];
        }
    }
    instance.return.stateNode.updater.enqueueForceUpdate(
        instance.return.stateNode
    );
}

document.addEventListener("getTornRFC", function() {
    const tornRFC = getRFC();
    var e = new CustomEvent("RFCtoReTorn", {detail: tornRFC});
    document.dispatchEvent(e);
});

document.addEventListener("reUpdateState", function(msg) {
    if (msg?.detail?.newState != undefined && msg?.detail?.className != undefined) {
        const el = document.getElementsByClassName(msg.detail.className)[0]
        reUpdateState(el, msg.detail.newState);
    }
});
  
document.addEventListener("initializeTooltip", function() {
    initializeTooltip('.content-wrapper', 'white-tooltip');
});

document.addEventListener("re_jail_refresh", function() {
    jail_refresh();
});

function interceptFetch(url,q, callback) {
    const originalFetch = window.fetch;
    window.fetch = function() {
      return new Promise((resolve, reject) => {
        return originalFetch.apply(this, arguments).then(function(data) {
            let dataurl = data.url.toString();
            if (dataurl.includes(url) && dataurl.includes(q)) {
               const clone = data.clone();
               if (clone) {
                  clone.json().then((response) => callback(response, data.url))
                  .catch((error) => {
                    console.log("[ReTorn][InterceptFetch] Error with clone.json(). Most likely not JSON data.", error)
                  })
               }
            }
            resolve(data);
        })
        .catch((error) => {
          console.log("[ReTorn][InterceptFetch] Error with fetch.", error)
        })
      });
    };
}

interceptFetch("torn.com","torn.com", (response, url) => {

/* InterceptFetch Logs */
    document.dispatchEvent(new CustomEvent('re_interceptFetch_log', 
        {"detail":{
            "url": url,
            "response": response
        }}
    ));

/* Mini Profiles */
    if (url.includes('step=getUserNameContextMenu') || url.includes('step=getMiniProfile') || url.includes('sid=UserMiniProfile')) {
        document.dispatchEvent(new CustomEvent('re_miniprofiles', 
        {"detail":{
            "response": response
        }}
        ));
    }

 /* Christmas Town */
    if (url.includes('christmas_town.php')) {
        document.dispatchEvent(new CustomEvent('re_christmastown', 
        {"detail":{
            "response": response
        }}
        ));
    }


/* Faction War Filters */
    if (url.includes('faction_wars.php?') && url.includes('wardescid=rank')) { //EXAMPLE: https://www.torn.com/faction_wars.php?redirect=false&step=getwardata&factionID=9533&userID=0&wardescid=rank&update=true
        const e = new CustomEvent("re_ranked_wars_fetch");
        document.dispatchEvent(e);
    }
    
    /* Faction War Filters */
    if (url.includes('sid=factionsRankedWarProcessBarRefresh')) { //EXAMPLE: https://www.torn.com/page.php?sid=factionsRankedWarProcessBarRefresh&userIds[]=1
        const e = new CustomEvent("re_ranked_wars_fetch");
        document.dispatchEvent(e);
    }

/* Faction Territory Wars */
    if (url.includes('faction_wars.php?') && url.match(/wardescid=\d+/)) { //EXAMPLE: https://www.torn.com/faction_wars.php?redirect=false&step=getwardata&factionID=9533&userID=0&wardescid=31558&update=true 
        const e = new CustomEvent("re_territory_wars_fetch");
        document.dispatchEvent(e);
    }
});
  

function jail_refresh() { // Basically completely copied from native Torn jail function
    var $user_info_wrap = $(".user-info-list-wrap"),
          $user_title_wrap = $('.users-list-title'),
          $msg_info_wrap = $(".msg-info-wrap"),
          $msg_empty_info_wrap = $('.msg-empty-info-wrap'),
          $pagination_wrap = $(".pagination-wrap"),
          $parent = $('.userlist-wrapper');
  
          var pathname = location.pathname,
              hash = queryStringToObj(location.hash.replace(/[#\/]/g, '')),
              action_name = 'jail',
              $handelbars_id = 'jail-user-list-item';
          var template = Handlebars.templates[$handelbars_id];
  
          var fetchPath = /jailview/i.test(window.location.pathname) ? 'jailview' : 'hospitalview'
  
          var avoidCacheURL = '/' + fetchPath + '.php' + '?' + new Date().getTime() + '=' + Math.random();
  
  
          var options = {
            action: avoidCacheURL,
            type: "post",
            data: {
                action: action_name,
                start: hash.start || 0
            },
            beforeSend: function() {
                $user_title_wrap.show();
                $user_info_wrap.html('<li class="last"><span class="ajax-preloader m-top10 m-bottom10"></span></li>');
            },
            complete: function() {
                $(window).resize();
            },
            success: function(str) {
                try {
                    var msg = JSON.parse(str);
                    var data = msg.data;
  
                    if (!msg.total) {
                        $user_title_wrap.hide();
                    } else {
                        $parent.find('.total').text(msg.total);
                        $parent.find('.aux-verb').text(msg.total > 1 ? 'People are' : 'Person is');
                    }
  
                    $msg_info_wrap.html(data.info_text);
                    
                    $msg_empty_info_wrap.html(data.info_empty);
                    $pagination_wrap.html(data.pagination ? data.pagination : "");
                    $user_info_wrap.empty().append(template(data));

                    const e = new CustomEvent("re_jail_refresh_complete");
                    document.dispatchEvent(e);
  
                } catch (e) {
                    console.log("[ReTorn][Jail Refresh] Error: ",e);
                }
            }
          }
  
          $.ajax(options);
}