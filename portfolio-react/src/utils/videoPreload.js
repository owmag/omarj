/**
 * Warm HTTP cache + decoder for every portfolio clip (mp4 + webm per entry).
 * Hidden elements are removed after canplay to limit concurrent decoders.
 */
export function collectUniqueVideoUrls(projectVideosMap) {
  const urls = new Set();
  const add = (o) => {
    if (!o || typeof o !== "object") return;
    if (typeof o.mp4 === "string") urls.add(o.mp4);
    if (typeof o.webm === "string") urls.add(o.webm);
  };
  Object.values(projectVideosMap).forEach((entry) => {
    add(entry);
    add(entry?.vid1);
    add(entry?.vid2);
  });
  return [...urls];
}

function preloadOneUrl(url) {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.preload = "auto";
    v.setAttribute("aria-hidden", "true");
    const s = document.createElement("source");
    s.src = url;
    v.appendChild(s);
    v.style.cssText =
      "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;visibility:hidden";

    const finish = () => {
      try {
        v.pause();
        v.removeAttribute("src");
        while (v.firstChild) v.removeChild(v.firstChild);
        v.load();
      } catch {
        /* ignore */
      }
      v.remove();
      resolve();
    };

    const t = window.setTimeout(finish, 15000);
    const done = () => {
      window.clearTimeout(t);
      finish();
    };

    v.addEventListener("canplaythrough", done, { once: true });
    v.addEventListener("error", done, { once: true });
    document.body.appendChild(v);
    v.load();
    v.play().catch(() => {});
  });
}

export function preloadPortfolioVideos(projectVideosMap) {
  const urls = collectUniqueVideoUrls(projectVideosMap);
  return Promise.all(urls.map((u) => preloadOneUrl(u)));
}

const HAVE_CURRENT_DATA = 2;

/**
 * After first frame is available (and play() attempted), add .show so CSS fades opacity 0 → 1.
 */
export function revealVideoWhenReady(video) {
  if (!video || video.classList.contains("show")) return;

  const paintThenShow = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (video.isConnected) video.classList.add("show");
      });
    });
  };

  const afterDecode = () => {
    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(() => paintThenShow());
    } else {
      paintThenShow();
    }
  };

  let kicked = false;
  let fallbackTimer;
  const kick = () => {
    if (kicked) return;
    kicked = true;
    if (fallbackTimer != null) window.clearTimeout(fallbackTimer);
    video.play().catch(() => {});
    afterDecode();
  };

  fallbackTimer = window.setTimeout(() => {
    if (!video.classList.contains("show") && video.isConnected) {
      kicked = true;
      video.play().catch(() => {});
      paintThenShow();
    }
  }, 5000);

  if (video.readyState >= HAVE_CURRENT_DATA) {
    kick();
    return;
  }

  const onReady = () => kick();
  video.addEventListener("loadeddata", onReady, { once: true });
  video.addEventListener("canplay", onReady, { once: true });
}
