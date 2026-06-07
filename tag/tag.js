(function() {
  'use strict';

  var PRIORITY_TAGS = ['전체', '구현'];

  function initTagFilter() {
    var postList = document.querySelector('.posts ul');
    var filterBar = document.querySelector('.tag-filter-bar');
    if (!postList || !filterBar) return;

    var posts = postList.querySelectorAll('li');
    var cardTags = postList.querySelectorAll('.tags > .tag');

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

    function filterByTag(tag) {
      var activeTag = tag === '전체' ? null : tag;

      posts.forEach(function(post) {
        var postTagEls = post.querySelectorAll('.tags > .tag');
        var tagTexts = Array.from(postTagEls).map(function(t) {
          return t.textContent.trim();
        });

        if (activeTag === null || tagTexts.includes(activeTag)) {
          post.style.display = '';
        } else {
          post.style.display = 'none';
        }
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
