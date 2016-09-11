var https = require('https');
var onesignal = require('../onesignal.json');

module.exports = {
  create(options) {
    return {
      app_id: onesignal.app_id,
      contents: {en: options.content},
      headings: {en: options.title},
      url: options.url || 'https://dudeka.fuckingwebsite.ru',
      filters: options.filters || [],
    };
  },

  send(notification) {
    var headers = {
      'Content-Type': 'application/json',
      Authorization: onesignal.auth,
    };

    var options = {
      host: 'onesignal.com',
      port: 443,
      path: '/api/v1/notifications',
      method: 'POST',
      headers: headers,
    };

    return new Promise((resolve, reject) => {
      var req = https.request(options, function(res) {
        res.on('data', resolve);
      });

      req.on('error', reject);

      req.write(JSON.stringify(notification));
      req.end();
    });
  },
};
