/* MuteTrump — shared matching logic (used by content script and options page). */
(function (global) {
  "use strict";

  function compile(terms, userPatterns) {
    const patterns = (terms.patterns || []).concat(userPatterns || []);
    const allow = terms.allow || [];
    const matchRe = new RegExp("(?:" + patterns.join("|") + ")", "gi");
    const allowRe = allow.length ? new RegExp("(?:" + allow.join("|") + ")", "gi") : null;
    return { matchRe, allowRe };
  }

  /** Returns true if `text` contains at least one non-allowlisted match. */
  function hasMatch(compiled, text) {
    if (!text) return false;
    compiled.matchRe.lastIndex = 0;
    if (!compiled.matchRe.test(text)) return false;
    return redact(compiled, text, "") !== text;
  }

  /**
   * Replace every match with `replacement`, except where the match sits
   * inside an allowlisted phrase (e.g. "trump card").
   */
  function redact(compiled, text, replacement) {
    if (!text) return text;
    const allowed = [];
    if (compiled.allowRe) {
      compiled.allowRe.lastIndex = 0;
      let m;
      while ((m = compiled.allowRe.exec(text)) !== null) {
        allowed.push([m.index, m.index + m[0].length]);
        if (m[0].length === 0) compiled.allowRe.lastIndex++;
      }
    }
    compiled.matchRe.lastIndex = 0;
    return text.replace(compiled.matchRe, function (match, offset) {
      const end = offset + match.length;
      for (const [a, b] of allowed) {
        if (offset >= a && end <= b) return match;
      }
      return replacement;
    });
  }

  global.MuteTrumpFilter = { compile, hasMatch, redact };
})(typeof self !== "undefined" ? self : this);
