(function (global) {
  var PERSONAL_DOMAINS = {
    'gmail.com': 1, 'googlemail.com': 1,
    'yahoo.com': 1, 'yahoo.co.in': 1, 'yahoo.co.uk': 1, 'ymail.com': 1, 'rocketmail.com': 1,
    'hotmail.com': 1, 'hotmail.co.uk': 1, 'outlook.com': 1, 'outlook.co.uk': 1,
    'live.com': 1, 'live.in': 1, 'msn.com': 1, 'passport.com': 1,
    'icloud.com': 1, 'me.com': 1, 'mac.com': 1,
    'aol.com': 1, 'aim.com': 1,
    'protonmail.com': 1, 'proton.me': 1, 'pm.me': 1,
    'zoho.com': 1, 'zohomail.com': 1,
    'gmx.com': 1, 'gmx.net': 1, 'gmx.de': 1,
    'mail.com': 1, 'email.com': 1, 'inbox.com': 1,
    'yandex.com': 1, 'yandex.ru': 1,
    'rediffmail.com': 1, 'rediff.com': 1,
    'tutanota.com': 1, 'tuta.com': 1, 'tutamail.com': 1,
    'fastmail.com': 1, 'fastmail.fm': 1,
    'mailinator.com': 1, 'guerrillamail.com': 1, 'tempmail.com': 1,
    '10minutemail.com': 1, 'trashmail.com': 1, 'yopmail.com': 1
  };

  var EMAIL_RE = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;

  function domainOf(value) {
    var match = String(value || '').trim().toLowerCase().match(EMAIL_RE);
    return match ? match[1] : '';
  }

  function isBusinessEmail(value) {
    var domain = domainOf(value);
    if (!domain) return false;
    if (PERSONAL_DOMAINS[domain]) return false;
    var parts = domain.split('.');
    if (parts.length > 2) {
      var parent = parts.slice(-2).join('.');
      if (PERSONAL_DOMAINS[parent]) return false;
    }
    return true;
  }

  global.PravadhEmail = {
    isBusinessEmail: isBusinessEmail,
    message: 'Please use a company email. Personal inboxes such as Gmail, Yahoo, Outlook.com, Hotmail, and iCloud are not accepted.'
  };
})(window);
