'use strict';

const navigation = document.querySelector('.nav')
const hamburger = document.querySelector('.hamburger')
const enteredLink = document.querySelector('.shortener__form-url')
const buttonShorten = document.querySelector('.shortener__form-submit');
const errorPlaceholder = document.querySelector('.error');

hamburger.addEventListener('click', function(){
  navigation.classList.toggle('hidden');
});

const renderLink = function(link) {
  let {originalUrl, shortenedUrl} = link; 
  let html = `
    <div class="shortener__link">
      <p class="shortener__long-link">${originalUrl}</p>
      <div>
        <p class="shortener__short-link">${shortenedUrl}</p>
        <button type="button" class="shortener__copy-link">Copy</button>
      </div>
    </div>
  `;
  document.querySelector('.shortener__links').insertAdjacentHTML('afterbegin', html)
}

const loading = function(state) {
  buttonShorten.querySelector('p').classList[state ? 'add' : 'remove']('hidden');
  buttonShorten.querySelector('.preloader').classList[state ? 'remove' : 'add']('hidden');
  buttonShorten.disabled = state ? true : false;
}

const saveToLocalStorage = function(link) {
  if (localStorage.getItem('links')) {
    let storedLinks = JSON.parse(localStorage.getItem('links'));
    storedLinks.push(link);
    localStorage.removeItem('links');
    localStorage.setItem('links', JSON.stringify(storedLinks));
    return;
  }
  let shortLinks = [];
  shortLinks.push(link);
  localStorage.setItem('links', JSON.stringify(shortLinks))
}

const error = function(message) {
  enteredLink.classList.add('url-input-error');
  errorPlaceholder.textContent = message;
  errorPlaceholder.classList.remove('hidden');
  buttonShorten.disabled = true;
  const timer = setTimeout(function() {
    buttonShorten.disabled = false;
    enteredLink.classList.remove('url-input-error')
    errorPlaceholder.classList.add('hidden');
    clearInterval(timer);
  }, 2000);
}

function copyToClipboard(text) {
  const clipboard = navigator.clipboard;
  return clipboard.writeText(text);
}

const shortenUrl = function(url) {
  if (!url) {
    error('Please add a link');
    return;
  }
  loading(true);
  let endPoint = `https://api.shrtco.de/v2/shorten?url=${url}`;
  let possibleErrors = new Map();
  possibleErrors
  .set(2, "That looks like a wrong url")
  .set(3, "Hold on a sec before trying again")
  .set(6, "Unknown error")
  .set(10, "You're not allowed to shorten this link")
  
  fetch(endPoint)
  .then(response => response.json())
  .then(data => {
    loading(false);
    if (!data.ok) {
      error(possibleErrors.get(data.error_code))
      return;
    }
    enteredLink.value = "";
    let {original_link:originalUrl, full_short_link:shortenedUrl} = data.result;
    saveToLocalStorage({originalUrl, shortenedUrl})
    renderLink({originalUrl, shortenedUrl});
  })
  .catch((err) => {
    loading(false);
    alert(err.message)
  })
}

buttonShorten.addEventListener('click', function(e) {
  e.preventDefault();
  shortenUrl(enteredLink.value);
});

document.querySelector('.shortener__links').addEventListener('click', function(e) {
  let clicked = e.target;
  if (clicked !== e.currentTarget && clicked.classList.contains('shortener__copy-link')) {
    let link = clicked.previousElementSibling.textContent;
    copyToClipboard(link).then(function() {
      clicked.textContent = 'Copied!';
      clicked.style.backgroundColor = 'var(--very-dark-violet)';
      clicked.disabled = true;
    })
  }
})

window.addEventListener("load", function() {
  let links = localStorage.getItem('links');
  if (links) {
    links = JSON.parse(links);
    links.forEach(link => {
      renderLink(link);
    });
  }
});