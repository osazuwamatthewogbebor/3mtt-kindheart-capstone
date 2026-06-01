const FooterComponent = {
  getYear() {
    return new Date().getFullYear();
  },
  getFooterInnerHtml() {
    const isPage = window.location.pathname.includes('/pages/');
    const assetsPrefix = isPage ? '../' : '';
    const pagePrefix = isPage ? '' : 'pages/';
    const homeHref = isPage ? '../index.html' : 'index.html';
    return `
  <div class="container footer-grid">
    <div class="footer-col">
      <div class="footer-logo">
        <img src="${assetsPrefix}assets/image/favicon.svg" alt="KindHeart" width="28" height="28">
        <span>KindHeart</span>
      </div>
      <p>Build meaningful campaigns and support causes that matter with secure, transparent crowdfunding.</p>
    </div>
    <div class="footer-col">
      <h4>Explore</h4>
      <ul>
        <li><a href="${homeHref}">Home</a></li>
        <li><a href="${pagePrefix}campaigns.html">Campaigns</a></li>
        <li><a href="${pagePrefix}how-it-works.html">How It Works</a></li>
        <li><a href="${pagePrefix}about.html">About</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Support</h4>
      <ul>
        <li><a href="${pagePrefix}contact.html">Contact</a></li>
        <li><a href="${pagePrefix}privacy-policy.html">Privacy Policy</a></li>
        <li><a href="${pagePrefix}terms-of-service.html">Terms</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Account</h4>
      <ul>
        <li><a href="${pagePrefix}login.html">Login</a></li>
        <li><a href="${pagePrefix}register.html">Register</a></li>
        <li><a href="${pagePrefix}user-dashboard.html#profile">Profile</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; <span class="footer-year">${this.getYear()}</span> KindHeart. All rights reserved.</p>
  </div>
    `;
  },
  getFooterHtml() {
    return `<footer class="footer">${this.getFooterInnerHtml()}</footer>`;
  },
  updateFooterYear() {
    const year = this.getYear();
    document.querySelectorAll('.footer-year').forEach((el) => {
      el.textContent = year;
    });
  },
  render() {
    const existingFooter = document.querySelector('footer');
    if (existingFooter) {
      existingFooter.innerHTML = this.getFooterInnerHtml();
      this.updateFooterYear();
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getFooterHtml();
    document.body.appendChild(wrapper.firstElementChild);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  FooterComponent.render();
});
