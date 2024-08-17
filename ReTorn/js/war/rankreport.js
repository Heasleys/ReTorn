const obsOptions = {attributes: false, childList: true, characterData: false, subtree:true};
var items;
const cacheObserver = new MutationObserver(function(mutations) {
    if ($('li.members-bonus-row > div[class*="memberBonusRow_"] > div').length != 0 && $('.re_cache_value').length == 0) {
        insertCacheValue();
        cacheObserver.disconnect();
    }
});

(function() {

    if (features?.pages?.war?.cache_value?.enabled) {
        
        sendMessage({name: "get_local", value: "re_items"})
        .then((r) => {
            if (r.status) {
                items = r?.data?.items;
                cacheObserver.observe(document, obsOptions);
            }
        })
        .catch((e) => console.error(e))



    }


})();

function insertCacheValue() {
    $('li.members-bonus-row > div[class*="memberBonusRow_"] > div').each(function() {
        const text = $(this).text();
        const result = getCaches(text);
        let value = 0;
        let title = `<ul>`;
        for (const [cache, qty] of Object.entries(result)) {
            let market_value = items[CACHE_NAMES_TO_ID[cache]]["market_value"];
            value += qty * market_value;
            title += `<li>${cache.replace(' Cache', '')}: ${qty} x ${market_value.toLocaleString("en-US")} = ${(qty * market_value).toLocaleString("en-US")}</li>`
        }
        title += `</ul>`;
        $(this).after(`<div class="re_cache_value mt1">Cache value: <span class="t-green bold" title="${title}" style="cursor: pointer;">$${value.toLocaleString("en-US")}</span></div>`)
    });
}

function getCaches(text) {
    const regex = /(\d+)x\s+(\w+\s?[\w\s]*?)\s+Cache/g;
    let match;
    const caches = {};
    
    while ((match = regex.exec(text)) !== null) {
        const count = parseInt(match[1]);
        const type = match[2] + " Cache";
        caches[type] = count;
    }
    
    return caches;
}