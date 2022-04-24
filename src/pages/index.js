import * as React from "react"
import Layout from '../components/layout';

// styles
const pageStyles = {
  color: "#232129",
  padding: 96,
  fontFamily: "-apple-system, Roboto, sans-serif, serif",
}
const headingStyles = {
  marginTop: 0,
  marginBottom: 64,
  maxWidth: 320,
}
const headingAccentStyles = {
  color: "#663399",
}
const paragraphStyles = {
  marginBottom: 48,
}
const codeStyles = {
  color: "#8A6534",
  padding: 4,
  backgroundColor: "#FFF4DB",
  fontSize: "1.25rem",
  borderRadius: 4,
}
const listStyles = {
  marginBottom: 96,
  paddingLeft: 0,
}
const listItemStyles = {
  fontWeight: 300,
  fontSize: 24,
  maxWidth: 560,
  marginBottom: 30,
}

const linkStyle = {
  color: "#0D96F2",
  fontWeight: "bold",
  fontSize: 16,
  verticalAlign: "5%",
}

const docLinkStyle = {
  ...linkStyle,
  listStyleType: "none",
  marginBottom: 24,
}

const descriptionStyle = {
  color: "#232129",
  fontSize: 14,
  marginTop: 10,
  marginBottom: 0,
  lineHeight: 1.25,
}

const docLink = {
  text: "Documentation",
  url: "https://www.gatsbyjs.com/docs/",
  color: "#8954A8",
}

const badgeStyle = {
  color: "#fff",
  backgroundColor: "#088413",
  border: "1px solid #088413",
  fontSize: 11,
  fontWeight: "bold",
  letterSpacing: 1,
  borderRadius: 4,
  padding: "4px 6px",
  display: "inline-block",
  position: "relative",
  top: -2,
  marginLeft: 10,
  lineHeight: 1,
}

// data
const links = [
  {
    text: "[KOR] Front-end testing strategy",
    url: `http://doong-jo.github.io/blog/posts/front-end_testing_strategy/`,
    description:
      "Kent C. Dodds의 테스팅 원칙을 기반으로 하는 프론트엔드 전략을 소개합니다.",
    color: "#999",
  },
  {
    text: "Monorepo로 대규모 React 프로젝트 관리하기",
    url: "https://medium.com/myrealtrip-product/monorepo%EB%A1%9C-%EB%8C%80%EA%B7%9C%EB%AA%A8-react-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EA%B4%80%EB%A6%AC%ED%95%98%EA%B8%B0-d12b65340306",
    description:
      "점차 규모가 커지는 프론트엔드 프로젝트, 어떻게 관리할 것인가?",
    color: "#999",
  },
  {
    text: "API 없이 프론트엔드 개발하기",
    url: "https://medium.com/@sdong001_28201/api-%EC%97%86%EC%9D%B4-%ED%94%84%EB%A1%A0%ED%8A%B8%EC%97%94%EB%93%9C-%EA%B0%9C%EB%B0%9C%ED%95%98%EA%B8%B0-89fdabceaa19?source=user_profile---------1----------------------------",
    description:
      "백엔드팀에서 API는 한창 개발 중이다. 하지만 프론트엔드 개발은 시작해야한다. 당신의 전략은?",
    color: "#999",
  },
  {
    text: "실용적인 리액트 테스트 전략",
    url: "https://velog.io/@sdong001/%EC%8B%A4%EC%9A%A9%EC%A0%81%EC%9D%B8-%EB%A6%AC%EC%95%A1%ED%8A%B8-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EC%A0%84%EB%9E%B5",
    description:
      "실용적인 리액트 테스트는 어떻게 해야할 것인가에 대한 고민",
    color: "#999",
  }
]

const githubSvgStyle = {
  fill: "#151513",
  color: "#fff",
  position: "absolute",
  top: 0,
  border: 0,
  right: 0,
  color: "#fff",
};

const octoArmStyle = {
  transformOrigin: "130px 106px",
};

const octoBodyStyle = {
  fill: 'currentColor'
};

// markup
const IndexPage = () => {
  return (
    <Layout>
      <main style={pageStyles}>
        <title>doong-jo</title>
        <a href="https://github.com/doong-jo" className="github-corner" aria-label="View source on GitHub">
          <svg style={githubSvgStyle} width={80} height={80} viewBox="0 0 250 250" aria-hidden>
            <path
              d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z" />
            <path style={octoArmStyle} className="octo-arm"
              d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor"></path>
            <path style={octoBodyStyle} className="octo-body"
              d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" />
          </svg>
        </a>
        <h1 style={headingStyles}>
          doong-jo
        </h1>
        <h2>Posts</h2>
        {links.map(link => (
          <li key={link.url} style={{ ...listItemStyles, color: link.color }}>
            <span>
              <a
                style={linkStyle}
                href={`${link.url}?utm_source=starter&utm_medium=start-page&utm_campaign=minimal-starter`}
              >
                {link.text}
              </a>
              {link.badge && (
                <span style={badgeStyle} aria-label="New Badge">
                  NEW!
                </span>
              )}
              <p style={descriptionStyle}>{link.description}</p>
            </span>
          </li>
        ))}
      </main>
    </Layout>
  )
}

export default IndexPage
