(function () {
  function checkOnlineStatus() {
    var banner = document.querySelector('.offline-banner');
    if (!banner) {
      if (!navigator.onLine) {
        var tokens = [];
        tokens.push('<div className="offline-banner"');
        tokens.push(' style="position:fixed;top:0;left:0;right:0;background:var(--primary);color:var(--text-white);padding:0.75rem 1rem;font-size:0.875rem;z-index:9999;box-shadow:0 2px 4px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:space-between;"');
        tokens.push('>');
        tokens.push('<span>You are offline. Some features may be limited.</span>');
        tokens.push('<button className="btn btn-outline text-xs" style="marginLeft:0.5rem" onclick="window.location.reload()">Back online</button>');
        tokens.push('</div>');
        var html = tokens.join('');
        var div = document.createElement('div');
        div.innerHTML = html;
        var bannerElement = div.firstElementChild;
        if (bannerElement) {
          document.body.insertBefore(bannerElement, document.body.firstChild);
        }
      }
    }
  }
  window.addEventListener('online', checkOnlineStatus);
  window.addEventListener('offline', checkOnlineStatus);
  checkOnlineStatus();
})();