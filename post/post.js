/**
 * id가 "posts"인 element 하위에 포스팅 목록을 추가한다.
 */
async function showPostList() {
  const postData = await (await fetch("../resources/data/posts.json")).json();

  const posts = postData
    .map(({ href, textContent, date }) => ({
      href: href.startsWith("http") ? href : `posts/${href}.html`,
      textContent,
      date,
    }))
    .sort((a, b) => new Date(a) - new Date(b));

  const postsElement = document.getElementById("posts");
  const ulElement = document.createElement("ul");
  postsElement.appendChild(ulElement);

  posts.forEach(({ href, textContent, date }) => {
    const navItem = document.createElement("li");

    const linkElement = document.createElement("a");
    linkElement.href = href;
    linkElement.textContent = textContent;

    const timeElement = document.createElement("time");
    timeElement.textContent = `${date}.`;

    navItem.appendChild(timeElement);
    navItem.appendChild(linkElement);

    ulElement.appendChild(navItem);
  });
}

showPostList();
