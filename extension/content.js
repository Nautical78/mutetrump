/* MuteTrump — content script. Scans the page and hides/redacts matches. */
(function () {
  "use strict";

  const DEFAULTS = {
    enabled: true,
    mode: "redact",          // "redact" | "blur" | "hide"
    replacement: "[redacted]",
    userPatterns: [],
    disabledSites: []
  };

  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE"]);
  // Elements that, when a match is found inside them, get hidden/blurred as a unit.
  const BLOCK_SELECTOR = "article, li, tr, section, blockquote, figure, [role=article], [data-testid], div, p, h1, h2, h3, h4, h5, h6, a";

  let settings = Object.assign({}, DEFAULTS);
  let compiled = null;
  let observer = null;
  let scheduled = false;
  const pending = new Set();

  function siteDisabled() {
    const host = location.hostname.replace(/^www\./, "");
    return settings.disabledSites.some(function (s) {
      return host === s || host.endsWith("." + s);
    });
  }

  function rebuild() {
    compiled = MuteTrumpFilter.compile(self.MUTETRUMP_TERMS, settings.userPatterns);
  }

  function closestBlock(node) {
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!el) return null;
    // Prefer the smallest "item"-like ancestor; cap at a few levels so we
    // never hide a whole page because one sidebar link matched.
    if (el.closest("head")) return null;
    let cur = el, depth = 0, best = null;
    while (cur && depth < 6) {
      if (cur.matches("article, li, tr, [role=article], blockquote, figure")) return cur;
      if (!best && cur.matches(BLOCK_SELECTOR)) best = cur;
      cur = cur.parentElement;
      depth++;
    }
    return best || el;
  }

  function markBlock(el) {
    if (!el || el === document.body || el === document.documentElement) return;
    el.setAttribute("data-mutetrump", settings.mode);
  }

  function processTextNode(node) {
    const text = node.nodeValue;
    if (!text || text.length < 3) return;
    if (!MuteTrumpFilter.hasMatch(compiled, text)) return;
    if (settings.mode === "redact") {
      node.nodeValue = MuteTrumpFilter.redact(compiled, text, settings.replacement);
      const p = node.parentElement;
      if (p) p.setAttribute("data-mutetrump", "redact");
    } else {
      markBlock(closestBlock(node));
    }
  }

  function processAttributes(el) {
    for (const attr of ["alt", "title", "aria-label", "placeholder"]) {
      const v = el.getAttribute && el.getAttribute(attr);
      if (v && MuteTrumpFilter.hasMatch(compiled, v)) {
        if (settings.mode === "redact") {
          el.setAttribute(attr, MuteTrumpFilter.redact(compiled, v, settings.replacement));
        } else {
          markBlock(closestBlock(el));
        }
      }
    }
    // Images whose src/alt mention the term are hidden in every mode.
    if (el.tagName === "IMG") {
      const src = el.getAttribute("src") || "";
      const alt = el.getAttribute("alt") || "";
      if (MuteTrumpFilter.hasMatch(compiled, decodeURIComponent(src)) || MuteTrumpFilter.hasMatch(compiled, alt)) {
        el.setAttribute("data-mutetrump", "hide");
      }
    }
  }

  function scan(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) { processTextNode(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_TAGS.has(root.tagName)) return;
      processAttributes(root);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeType === Node.ELEMENT_NODE) {
          return SKIP_TAGS.has(n.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const texts = [];
    let n;
    while ((n = walker.nextNode())) texts.push(n);
    for (const t of texts) processTextNode(t);
    if (root.querySelectorAll) {
      for (const el of root.querySelectorAll("img, [alt], [title], [aria-label], [placeholder]")) processAttributes(el);
    }
  }

  function scanTitle() {
    if (document.title && MuteTrumpFilter.hasMatch(compiled, document.title)) {
      document.title = MuteTrumpFilter.redact(compiled, document.title, settings.replacement);
    }
  }

  function flush() {
    scheduled = false;
    const nodes = Array.from(pending);
    pending.clear();
    for (const n of nodes) {
      if (n.isConnected) scan(n);
    }
    scanTitle();
  }

  function schedule(node) {
    pending.add(node);
    if (!scheduled) {
      scheduled = true;
      (self.requestIdleCallback || self.requestAnimationFrame)(flush);
    }
  }

  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(function (mutations) {
      for (const m of mutations) {
        if (m.type === "characterData") schedule(m.target);
        else if (m.type === "attributes") schedule(m.target);
        else for (const n of m.addedNodes) schedule(n);
      }
    });
    observer.observe(document.documentElement, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ["alt", "title", "aria-label", "src"]
    });
  }

  function unmarkAll() {
    for (const el of document.querySelectorAll("[data-mutetrump]")) el.removeAttribute("data-mutetrump");
  }

  function start() {
    if (!settings.enabled || siteDisabled()) {
      if (observer) observer.disconnect();
      unmarkAll();
      return;
    }
    rebuild();
    scan(document.documentElement);
    scanTitle();
    startObserver();
  }

  function load(cb) {
    chrome.storage.sync.get(DEFAULTS, function (items) {
      settings = Object.assign({}, DEFAULTS, items);
      cb();
    });
  }

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== "sync") return;
    load(function () {
      // Mode/pattern changes require a fresh page for text already redacted,
      // but block-level marks can be reapplied live.
      unmarkAll();
      start();
    });
  });

  load(start);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { if (compiled) scan(document.documentElement); });
  }
})();
