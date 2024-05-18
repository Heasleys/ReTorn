/* Intercept Fetch Logs */
(function() {
    document.addEventListener('re_interceptFetch_log', function (r) {
        if (settings?.interceptFetch_logs) {
            console.log("[ReTorn][InterceptFetch] Found a fetch from: " + r?.detail?.url, r?.detail?.response);
        }
    });
})();
