

      console.log("mini profiles");


console.log("intercept fetch define");
      function interceptFetch(url,q, callback) {
        console.log("intercept fetching");
          var originalFetch = fetch;
          fetch = function() {
              return originalFetch.apply(this, arguments).then(function(data) {
                  let dataurl = data.url.toString();
                  if (dataurl.includes(url) && dataurl.includes(q)) {
                      const clone = data.clone();
                      clone.json().then((response) => callback(response, data.url));
                  }

                  return data;
              });
          };
      }
console.log("intercept fetch 1");
      interceptFetch("profiles.php","step=getUserNameContextMenu", (response, url) => {
          console.log("intercept fetch 2");
          miniProfiles(response);
      });


  function miniProfiles(response) {

  console.log(response);
      if (response && response.user && response.user.lastAction && response.user.lastAction.seconds) {
          let message = "Last Action: ";
          let seconds = response.user.lastAction.seconds;

          let test = secondsToHms(seconds);
          console.log(test);

      }

  }


  function secondsToHms(d) {
      d = Number(d);
      var weeks = Math.floor(d / 604800);
      var days = Math.floor(d % 604800 / 86400);
      var h = Math.floor(d % 86400 / 3600);
      var m = Math.floor(d % 3600 / 60);
      var s = Math.floor(d % 3600 % 60);

      var weeksDisplay = weeks > 0 ? weeks + (weeks == 1 ? " week, " : " weeks, ") : "";
      var dayDisplay = days > 0 ? days + (days == 1 ? " day, " : " days, ") : "";
      var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
      var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
      var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
      return weeksDisplay + dayDisplay + hDisplay + mDisplay + sDisplay;
  }
