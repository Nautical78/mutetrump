(function () {
  "use strict";
  const $ = function (id) { return document.getElementById(id); };
  let host = "";

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    try { host = new URL(tabs[0].url).hostname.replace(/^www\./, ""); } catch (e) { host = ""; }
    $("host").textContent = host || "(no site)";
    chrome.storage.sync.get({ enabled: true, mode: "redact", disabledSites: [] }, function (s) {
      $("enabled").checked = s.enabled;
      $("mode").value = s.mode;
      $("siteOff").checked = !!host && s.disabledSites.includes(host);
      $("siteOff").disabled = !host;
    });
  });

  $("enabled").addEventListener("change", function (e) {
    chrome.storage.sync.set({ enabled: e.target.checked });
  });
  $("mode").addEventListener("change", function (e) {
    chrome.storage.sync.set({ mode: e.target.value });
  });
  $("siteOff").addEventListener("change", function (e) {
    chrome.storage.sync.get({ disabledSites: [] }, function (s) {
      const set = new Set(s.disabledSites);
      if (e.target.checked) set.add(host); else set.delete(host);
      chrome.storage.sync.set({ disabledSites: Array.from(set) });
    });
  });
  $("options").addEventListener("click", function (e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
})();
