async function showOctoCat() {
  const svgData = await fetch("../resources/images/octo-cat.svg");

  const octoCatElement = document.createElement("a");
  octoCatElement.href = "https://github.com/doong-jo";
  octoCatElement.innerHTML = await svgData.text();
  octoCatElement.className = "github-corner";

  document.body.appendChild(octoCatElement);
}

showOctoCat();
