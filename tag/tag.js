(function() {
  'use strict';

  function initTagFilter() {
    var postList = document.querySelector('.posts ul');
    if (!postList) return;

    var posts = postList.querySelectorAll('li');
    var allTags = document.querySelectorAll('.posts .tag');

    function getTagFromHash() {
      var hash = window.location.hash;
      if (hash.startsWith('#tag=')) {
        return decodeURIComponent(hash.slice(5));
      }
      return null;
    }

    function filterByTag(tag) {
      posts.forEach(function(post) {
        var postTags = post.querySelectorAll('.tag');
        var tagTexts = Array.from(postTags).map(function(t) {
          return t.textContent;
        });

        if (tag === null || tagTexts.includes(tag)) {
          post.style.display = '';
        } else {
          post.style.display = 'none';
        }
      });

      allTags.forEach(function(t) {
        if (t.textContent === tag) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
    }

    allTags.forEach(function(tag) {
      tag.addEventListener('click', function(e) {
        e.preventDefault();
        var tagText = tag.textContent;
        var currentTag = getTagFromHash();

        if (currentTag === tagText) {
          history.pushState(null, '', window.location.pathname);
          filterByTag(null);
        } else {
          history.pushState(null, '', '#tag=' + encodeURIComponent(tagText));
          filterByTag(tagText);
        }
      });
    });

    var initialTag = getTagFromHash();
    if (initialTag) {
      filterByTag(initialTag);
    }

    window.addEventListener('popstate', function() {
      filterByTag(getTagFromHash());
    });
  }

  document.addEventListener('DOMContentLoaded', initTagFilter);
})();
