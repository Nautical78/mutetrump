(function () {
  "use strict";
  const $ = function (id) { return document.getElementById(id); };
  const DEFAULTS = { mode: "redact", replacement: "[redacted]", userPatterns: [], disabledSites: [] };

  function lines(v) {
    return v.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function escapeIfPlain(p) {
    // Treat lines with no regex metacharacters as literal whole words.
    return /[\\^$.*+?()[\]{}|]/.test(p) ? p : "\\b" + p.replace(/\s+/g, "\\s+") + "\\b";
  }

  function preview() {
    try {
      const compiled = MuteTrumpFilter.compile(self.MUTETRUMP_TERMS, lines($("userPatterns").value).map(escapeIfPlain));
      $("testOut").textContent = MuteTrumpFilter.redact(compiled, $("testIn").value, $("replacement").value || "[redacted]");
      $("testOut").style.color = "";
    } catch (e) {
      $("testOut").textContent = "Pattern error: " + e.message;
      $("testOut").style.color = "#b00";
    }
  }

  chrome.storage.sync.get(DEFAULTS, function (s) {
    $("mode").value = s.mode;
    $("replacement").value = s.replacement;
    $("userPatterns").value = s.userPatterns.join("\n");
    $("disabledSites").value = s.disabledSites.join("\n");
    preview();
  });

  $("save").addEventListener("click", function () {
    const patterns = lines($("userPatterns").value).map(escapeIfPlain);
    try { new RegExp(patterns.join("|"), "i"); } catch (e) {
      $("status").textContent = "Invalid pattern: " + e.message; $("status").style.color = "#b00"; return;
    }
    chrome.storage.sync.set({
      mode: $("mode").value,
      replacement: $("replacement").value || "[redacted]",
      userPatterns: patterns,
      disabledSites: lines($("disabledSites").value).map(function (h) { return h.replace(/^www\./, "").toLowerCase(); })
    }, function () {
      $("status").style.color = ""; $("status").textContent = "Saved";
      setTimeout(function () { $("status").textContent = ""; }, 1500);
    });
  });

  ["testIn", "replacement", "userPatterns"].forEach(function (id) { $(id).addEventListener("input", preview); });
})();
