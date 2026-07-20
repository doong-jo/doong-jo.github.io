(function() {
  'use strict';

  var PRIORITY_TAGS = ['전체', '구현'];
  var PAGE_SIZE = 10;

  function initTagFilter() {
    var postList = document.querySelector('.posts ul');
    var filterBar = document.querySelector('.tag-filter-bar');
    if (!postList || !filterBar) return;

    var posts = postList.querySelectorAll('li');
    var cardTags = postList.querySelectorAll('.tags > .tag');
    var postsSection = document.querySelector('.posts');
    var paginationNav = document.querySelector('.pagination');

    var matchedPosts = Array.from(posts);
    var currentPage = 1;

    function collectTags() {
      var tagSet = new Set();
      cardTags.forEach(function(tag) {
        var text = tag.textContent.trim();
        if (text && text !== '전체') {
          tagSet.add(text);
        }
      });

      var sorted = Array.from(tagSet).sort(function(a, b) {
        return a.localeCompare(b, 'ko');
      });

      var result = ['전체'];
      PRIORITY_TAGS.slice(1).forEach(function(tag) {
        if (tagSet.has(tag)) {
          result.push(tag);
          tagSet.delete(tag);
        }
      });
      sorted.forEach(function(tag) {
        if (tagSet.has(tag)) {
          result.push(tag);
        }
      });

      return result;
    }

    function buildFilterBar() {
      filterBar.innerHTML = '';
      collectTags().forEach(function(tagName) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tag';
        btn.textContent = tagName;
        btn.addEventListener('click', function() {
          selectTag(tagName);
        });
        filterBar.appendChild(btn);
      });
    }

    function getTagFromHash() {
      var hash = window.location.hash;
      if (hash.startsWith('#tag=')) {
        return decodeURIComponent(hash.slice(5));
      }
      return null;
    }

    function renderPage(page, shouldScroll) {
      var totalPages = Math.max(1, Math.ceil(matchedPosts.length / PAGE_SIZE));
      currentPage = Math.min(Math.max(1, page), totalPages);

      var start = (currentPage - 1) * PAGE_SIZE;
      var end = start + PAGE_SIZE;
      var visible = new Set(matchedPosts.slice(start, end));

      posts.forEach(function(post) {
        post.style.display = visible.has(post) ? '' : 'none';
      });

      renderPagination(totalPages);

      if (shouldScroll && postsSection) {
        postsSection.scrollIntoView({ block: 'start' });
      }
    }

    function renderPagination(totalPages) {
      if (!paginationNav) return;
      paginationNav.innerHTML = '';
      if (totalPages <= 1) return;

      function makeButton(label, page, options) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        if (options && options.ariaLabel) {
          btn.setAttribute('aria-label', options.ariaLabel);
        }
        if (options && options.current) {
          btn.setAttribute('aria-current', 'page');
        }
        if (options && options.disabled) {
          btn.disabled = true;
        } else {
          btn.addEventListener('click', function() {
            renderPage(page, true);
          });
        }
        paginationNav.appendChild(btn);
      }

      makeButton('‹', currentPage - 1, {
        ariaLabel: '이전 페이지',
        disabled: currentPage === 1
      });
      for (var i = 1; i <= totalPages; i++) {
        makeButton(String(i), i, { current: i === currentPage });
      }
      makeButton('›', currentPage + 1, {
        ariaLabel: '다음 페이지',
        disabled: currentPage === totalPages
      });
    }

    function filterByTag(tag) {
      var activeTag = tag === '전체' ? null : tag;

      matchedPosts = Array.from(posts).filter(function(post) {
        if (activeTag === null) return true;
        var postTagEls = post.querySelectorAll('.tags > .tag');
        return Array.from(postTagEls).some(function(t) {
          return t.textContent.trim() === activeTag;
        });
      });

      filterBar.querySelectorAll('.tag').forEach(function(t) {
        if (t.textContent === (tag || '전체')) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });

      cardTags.forEach(function(t) {
        if (activeTag !== null && t.textContent.trim() === activeTag) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });

      renderPage(1, false);
    }

    function selectTag(tagName) {
      var currentTag = getTagFromHash();
      var isAll = tagName === '전체';

      if (!isAll && currentTag === tagName) {
        history.pushState(null, '', window.location.pathname);
        filterByTag('전체');
        return;
      }

      if (isAll) {
        history.pushState(null, '', window.location.pathname);
        filterByTag('전체');
      } else {
        history.pushState(null, '', '#tag=' + encodeURIComponent(tagName));
        filterByTag(tagName);
      }
    }

    buildFilterBar();

    cardTags.forEach(function(tag) {
      tag.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        selectTag(tag.textContent.trim());
      });
    });

    var initialTag = getTagFromHash();
    if (initialTag) {
      filterByTag(initialTag);
    } else {
      filterByTag('전체');
    }

    window.addEventListener('popstate', function() {
      var hashTag = getTagFromHash();
      filterByTag(hashTag || '전체');
    });
  }

  document.addEventListener('DOMContentLoaded', initTagFilter);
})();
