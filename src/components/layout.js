import * as React from 'react';

import { MDXProvider } from "@mdx-js/react"
import './global.css';
import './post.css';

// https://www.gatsbyjs.com/docs/how-to/routing/customizing-components/
export default function Layout({ children }) {
  if (typeof window !== 'undefined') {
    const isPost = window.location.pathname.startsWith('/posts/');

    if (isPost) {
      document.body.classList.add('markdown-body');
    }
  }

  return (
    <MDXProvider>
      {children}
    </MDXProvider>
  )
}
