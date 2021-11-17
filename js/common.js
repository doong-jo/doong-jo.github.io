console.log('Hello stranger.');

document.querySelector('h1').onclick = (ev) => {
  navigator.share({
    title: document.title,
    text: 'Hello World',
    url: 'https://developer.mozilla.org',
  }); // share the URL of MDN
};
