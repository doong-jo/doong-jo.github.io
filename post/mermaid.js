/* Mermaid init for blog posts
 * Usage: <pre class="mermaid">flowchart LR ...</pre> */
(function () {
  if (typeof mermaid === "undefined") return;

  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "strict",
    fontFamily: "inherit",
  });

  var previousFocus = null;
  var zoomDialog = null;
  var savedScrollY = 0;
  var scrollLocked = false;

  var EXPAND_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>';

  function getDiagramLabel(sourceEl) {
    var figure = sourceEl.closest("figure");
    if (figure) {
      var caption = figure.querySelector("figcaption");
      if (caption && caption.textContent.trim()) {
        return caption.textContent.trim();
      }
    }
    return "다이어그램";
  }

  function ensureZoomDialog() {
    if (zoomDialog) return zoomDialog;

    zoomDialog = document.createElement("dialog");
    zoomDialog.id = "mermaid-zoom-dialog";
    zoomDialog.setAttribute("aria-labelledby", "mermaid-zoom-title");

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "mermaid-zoom-close";
    closeBtn.setAttribute("aria-label", "닫기");
    closeBtn.textContent = "×";

    var title = document.createElement("h2");
    title.id = "mermaid-zoom-title";
    title.className = "visually-hidden";
    title.textContent = "다이어그램 확대";

    var content = document.createElement("div");
    content.className = "mermaid-zoom-content";

    zoomDialog.appendChild(closeBtn);
    zoomDialog.appendChild(title);
    zoomDialog.appendChild(content);
    document.body.appendChild(zoomDialog);

    closeBtn.addEventListener("click", closeMermaidZoom);
    zoomDialog.addEventListener("click", function (e) {
      if (e.target === zoomDialog) closeMermaidZoom();
    });
    zoomDialog.addEventListener("cancel", function () {
      closeMermaidZoom();
    });

    return zoomDialog;
  }

  function lockPageScroll() {
    if (scrollLocked) return;
    savedScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = "-" + savedScrollY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    scrollLocked = true;
  }

  function unlockPageScroll() {
    if (!scrollLocked) return savedScrollY;
    var y = savedScrollY;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    scrollLocked = false;
    window.scrollTo(0, y);
    return y;
  }

  function openMermaidZoom(sourceEl, triggerBtn) {
    var svg = sourceEl.querySelector("svg");
    if (!svg) return;

    var dialog = ensureZoomDialog();
    var content = dialog.querySelector(".mermaid-zoom-content");
    var label = getDiagramLabel(sourceEl);

    previousFocus = triggerBtn || document.activeElement;
    content.replaceChildren();

    var clone = svg.cloneNode(true);
    clone.setAttribute("role", "img");
    clone.setAttribute("aria-label", label);
    content.appendChild(clone);

    lockPageScroll();
    dialog.showModal();
  }

  function closeMermaidZoom() {
    if (!zoomDialog || !zoomDialog.open) return;

    zoomDialog.close();
    var content = zoomDialog.querySelector(".mermaid-zoom-content");
    if (content) content.replaceChildren();

    unlockPageScroll();

    var focusTarget = previousFocus;
    previousFocus = null;

    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus({ preventScroll: true });
      window.scrollTo(0, savedScrollY);
    }
  }

  function enhanceMermaidViewers() {
    document.querySelectorAll("pre.mermaid, .mermaid").forEach(function (el) {
      if (el.dataset.mermaidEnhanced) return;
      if (!el.querySelector("svg")) return;

      var wrapper = document.createElement("div");
      wrapper.className = "mermaid-viewer";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mermaid-expand-btn";
      btn.setAttribute("aria-label", "다이어그램 확대");
      btn.innerHTML = EXPAND_ICON;

      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(btn);
      wrapper.appendChild(el);

      el.dataset.mermaidEnhanced = "true";

      btn.addEventListener("click", function () {
        openMermaidZoom(el, btn);
      });
    });
  }

  async function renderMermaid() {
    await mermaid.run({ querySelector: ".mermaid, pre.mermaid" });
    enhanceMermaidViewers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMermaid);
  } else {
    renderMermaid();
  }
})();
