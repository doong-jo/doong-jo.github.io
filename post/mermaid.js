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

  function renderMermaid() {
    mermaid.run({ querySelector: ".mermaid, pre.mermaid" });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMermaid);
  } else {
    renderMermaid();
  }
})();
