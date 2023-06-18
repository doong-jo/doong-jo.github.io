const postData = [
  {
    href: "블로그는_Vanilla로_만들자",
    textContent: "블로그는 Vanilla로 만들자",
    date: "2023-06-18",
  },
  {
    href: "https://blog.banksalad.com/tech/github-action-npm-cache/?utm_source=starter&utm_medium=start-page&utm_campaign=minimal-starter",
    textContent: "GitHub Action 에서 CI 속도 개선",
    date: "2022-08-29",
  },
  {
    href: "https://medium.com/myrealtrip-product/monorepo%EB%A1%9C-%EB%8C%80%EA%B7%9C%EB%AA%A8-react-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EA%B4%80%EB%A6%AC%ED%95%98%EA%B8%B0-d12b65340306",
    textContent: "Monorepo로 대규모 React 프로젝트 관리하기",
    date: "2020-03-20",
  },
  {
    href: "https://medium.com/@sdong001_28201/api-%EC%97%86%EC%9D%B4-%ED%94%84%EB%A1%A0%ED%8A%B8%EC%97%94%EB%93%9C-%EA%B0%9C%EB%B0%9C%ED%95%98%EA%B8%B0-89fdabceaa19",
    textContent: "API 없이 프론트엔드 개발하기",
    date: "2020-08-01",
  },
  {
    href: "https://velog.io/@sdong001/%EC%8B%A4%EC%9A%A9%EC%A0%81%EC%9D%B8-%EB%A6%AC%EC%95%A1%ED%8A%B8-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EC%A0%84%EB%9E%B5?utm_source=starter&utm_medium=start-page&utm_campaign=minimal-starter",
    textContent: "실용적인 리액트 테스트 전략",
    date: "2019-12-16",
  },
];

/**
 * id가 "posts"인 element 하위에 포스팅 목록을 추가한다.
 */
function showPostList() {
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
