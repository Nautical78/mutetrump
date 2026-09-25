# MuteTrump

A free browser extension that removes every mention of Donald Trump from the web pages you read. Works in Chrome, Edge, Brave and Firefox on Windows, Mac and Linux. No app store, no account, no data collection.

Pick how you want it handled:

| Mode | What happens |
|---|---|
| **Redact** (default) | The words are replaced with `[redacted]`. The rest of the page is untouched. |
| **Blur** | The whole post, headline or paragraph that mentions him is blurred out. |
| **Hide** | That post, headline or paragraph is removed from the page entirely. |

It also catches page titles, image descriptions, and content that loads as you scroll. Phrases like "trump card" and "trumpet" are left alone.

---

## Install — Chrome, Edge or Brave

1. Go to the [**Releases**](../../releases/latest) page and download **`mutetrump-chromium.zip`**.
2. Unzip it into a folder you'll keep — for example `Documents\MuteTrump`. **Don't delete this folder afterwards**; the browser runs the extension from it.
3. Open a new tab and go to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
4. Turn on **Developer mode** (a switch in the top-right corner in Chrome and Brave; left sidebar in Edge).
5. Click **Load unpacked** and choose the folder you unzipped.

Done. You'll see a MuteTrump icon in the toolbar (you may need to click the puzzle-piece icon and pin it).

> Chrome and Edge may show a "Disable developer mode extensions" message when they start. Click **✕** or **Keep**. It's a standard notice for any extension that didn't come from the store.

## Install — Firefox

Firefox's regular release only allows extensions signed by Mozilla. Two options:

**Try it out (lasts until Firefox restarts):**
1. Download **`mutetrump-firefox.zip`** from [Releases](../../releases/latest) and unzip it.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and pick the `manifest.json` file inside the folder.

**Keep it permanently:** use [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/) (free). Go to `about:config`, set `xpinstall.signatures.required` to `false`, then `about:addons` → gear icon → **Install Add-on From File…** → pick the zip.

## Using it

Click the toolbar icon to:
- switch between **Redact**, **Blur** and **Hide**
- turn it off everywhere
- pause it on the site you're currently on

Click **More options…** to add your own words or phrases, one per line, and see a live preview of what they'd do.

## Updating

Download the new zip from Releases, delete the contents of your MuteTrump folder, unzip the new files into it, then click the **reload** ↻ button on the extension in `chrome://extensions`.

## Privacy

Everything runs inside your browser. The extension makes no network requests, collects nothing, and has no server. Your settings are stored in your browser's own sync storage. You can read every line of it in the `extension/` folder — it's about 400 lines of plain JavaScript.

## Questions

**Why isn't this in the Chrome Web Store?** Store review is slow and unpredictable and the store can remove extensions at any time. Loading it yourself takes one extra minute and can't be taken away.

**A page looks broken.** Click the icon and choose **Pause on this site**, then [open an issue](../../issues) with the site name so it can be fixed.

**It missed something.** Add the word or phrase under **More options…**, or open an issue and it can be added to the default list.

**Can I change what it filters?** Yes. Your own additions go in the options page. The default list is in `extension/terms.js`.

## License

MIT — free to use, copy, change and share.
