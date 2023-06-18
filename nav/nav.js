const navData = [
  {
    href: "/index.html",
    textContent: "Post",
  },
  {
    href: "/about.html",
    textContent: "About",
  },
];

function createNav() {
  const navElement = document.querySelector("nav");
  const ulElement = document.querySelector("nav > #nav-list");

  navElement.appendChild(ulElement);

  navData.forEach(({ href, textContent }) => {
    const navItem = document.createElement("li");

    const linkElement = document.createElement("a");
    linkElement.href = href;
    linkElement.textContent = textContent;
    linkElement.id = "nav-" + textContent.toLowerCase();

    navItem.appendChild(linkElement);
    ulElement.appendChild(navItem);
  });
}

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
    currentNavItem.classList.add("current");
  }
}

createNav();
highlightCurrentNavItem();
