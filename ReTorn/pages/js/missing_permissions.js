var browser = browser || chrome;

const requiredPermissions = {
  origins: ["https://*.torn.com/*"]
}
$('#ask_permission').click(async function() {
  var isGranted = await browser.permissions.request(requiredPermissions);

  if (isGranted) {
    window.close();
  } else {
    alert("You must enabled these permissions to use ReTorn.")
  }
});