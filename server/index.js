var firebase = require('firebase');
var fetch = require('node-fetch');
var CronJob = require('cron').CronJob;

var notifications = require('./notifications');

firebase.initializeApp({
  serviceAccount: './serviceAccountCredentials.json',
  databaseURL: 'https://dudeka-401e8.firebaseio.com'
});

var db = firebase.database();
var eventsRef = db.ref('/events');

console.log('\nApplication started successfully! Listening for changes in database...\n\n');

eventsRef.on('child_added', function (snapshot) {
  var event = snapshot.val();
  var eventId = snapshot.key;
  var eventEnd = new Date(event.end);
  eventEnd.setHours(15);
  eventEnd.setMinutes(0);
  eventEnd.setSeconds(0);

  console.log(`Handling event ${event.name}...`);

  var job = new CronJob({
    cronTime: eventEnd,
    onTick() {
      console.log('sending notification for event', event.name);

      var notification = notifications.create({
        title: `Мероприятие «${event.name}» закончилось!`,
        content: 'Не забудьте рассчитаться с друзьями :–)',
        url: `https://dudeka.fuckingwebsite.ru/#/events/${eventId}`,
        filters: [{
          field: 'tag',
          relation: '=',
          key: eventId,
          value: '1',
        }],
      });

      notifications
        .send(notification)
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
    },
    start: true,
  });
});
