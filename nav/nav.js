let beforeNavItem = document.querySelector("nav ul li a.current");

function highlightCurrentNavItem() {
  const navItems = document.querySelectorAll("nav ul li a");
  const currentPath = window.location.pathname;

  const currentNavItem = Array.from(navItems).find((navItem) => {
    if (navItem.href.endsWith("index.html")) {
      return currentPath.startsWith("/posts/") || currentPath === "/" || currentPath.endsWith("index.html");
    }

    return navItem.href.endsWith(currentPath);
  });

  if (currentNavItem) {
    beforeNavItem.classList.remove("current");
    currentNavItem.classList.add("current");

    beforeNavItem = currentNavItem;
  }
}

highlightCurrentNavItem();
