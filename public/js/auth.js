(function () {
  const loginLink = document.getElementById('loginLink');
  const registerLink = document.getElementById('registerLink');
  const logoutLink = document.getElementById('logoutLink');
  const isLoggedIn = Boolean(localStorage.getItem('travlr-token'));

  if (loginLink) loginLink.hidden = isLoggedIn;
  if (registerLink) registerLink.hidden = isLoggedIn;
  if (logoutLink) {
    logoutLink.hidden = !isLoggedIn;
    logoutLink.addEventListener('click', function (event) {
      event.preventDefault();
      localStorage.removeItem('travlr-token');
      window.location.href = '/';
    });
  }
})();
