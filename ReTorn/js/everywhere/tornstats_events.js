(function() {


const tsobserver = new MutationObserver(function(mutations) {
    if ($('#mainContainer').length != 0) {
        if (features?.general?.torn_stats_events?.enabled) {
            getTornStats("events", 0.25)//get torn stats event data, cache for 15 minutes
            .then((r) => {
                if (r?.status && r?.events != undefined) {
                // Loop through events for unseen events and format them into a more readable message
                Object.entries(r?.events).forEach(([key, value]) => {
                    if (value.seen == 0) {
                        var date = new Date(value.timestamp * 1000);
                        var formattedTime = date.toLocaleString('en-GB', {
                            weekday: 'long', // long, short, narrow
                            day: 'numeric', // numeric, 2-digit
                            year: 'numeric', // numeric, 2-digit
                            month: 'long', // numeric, 2-digit, long, short, narrow
                            hour: 'numeric', // numeric, 2-digit
                            minute: 'numeric', // numeric, 2-digit
                            second: 'numeric', // numeric, 2-digit
                        });
                        var message = `
                        <span class="re-modal-body-text" data-eventid="${key}"><b>Torn Stats Event</b></span>
                        <span class="re-modal-body-text">${formattedTime}</span>
                        <span class="re-modal-body-text"><a href='https://www.tornstats.com/' target='_blank'>${value.event}</a></span>`;
                        ReTornModalWindow(message);
                    }
                });
                }
            })
            .catch((e) => {
                console.error(e);
            })
            tsobserver.disconnect();
        }
    }
});

tsobserver.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});


})();