var firebase = require('firebase');
var fetch = require('node-fetch');
var CronJob = require('cron').CronJob;

var notifications = require('./notifications');

var BASE_URI = 'https://wastd.ru';

firebase.initializeApp({
  serviceAccount: './serviceAccountCredentials.json',
  databaseURL: 'https://dudeka-401e8.firebaseio.com'
});

var db = firebase.database();
var eventsRef = db.ref('/events');

console.log('\nApplication started successfully! Listening for changes in database...\n\n');

eventsRef.on('child_added', onAddEvent);


function addEventJob(eventId, eventEnd) {
  return {
    cronTime: eventEnd,
    start: true,
    onTick() {
      console.log(`${event.name} has ended, sending notification...`);

      var notification = notifications.create({
        title: 'Потрачено',
        content: `Мероприятие «${event.name}» закончилось! Не забудьте рассчитаться с друзьями :–)`,
        url: `${BASE_URI}/events/${eventId}`,
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
  };
}

function getEventEndNotificationDate(eventEnd) {
  var eventEnd = new Date(eventEnd);
  eventEnd.setDate(eventEnd.getDate() + 1);
  eventEnd.setHours(15);
  eventEnd.setMinutes(0);
  eventEnd.setSeconds(0);

  return eventEnd;
}

function onAddEvent(snapshot) {
  var event = snapshot.val();
  var eventId = snapshot.key;

  console.log(`Handling event ${event.name}...`);

  var eventEnd = getEventEndNotificationDate(event.end);
  var job = new CronJob(addEventJob(eventId, eventEnd));
  var purchasesRef = db.ref(`/events/${eventId}/purchases`);
  var purchases = Object.keys(event.purchases || {});

  purchasesRef.on('child_added', onAddPurchase(event.name, eventId, purchases));
}

function onAddPurchase(eventName, eventId, oldPurchasesIds) {
  return (snapshot) => {
    var purchase = snapshot.val();
    var purchaseId = snapshot.key;
    if (oldPurchasesIds.indexOf(purchaseId) !== -1) return;

    console.log(`New purchase created in event "${eventName}", sending notification...`);

    var notification = notifications.create({
      title: 'Потрачено',
      content: `В мероприятие «${eventName}» добавлена новая покупка «${purchase.name}»`,
      url: `${BASE_URI}/events/${eventId}/purchases/${purchaseId}`,
      filters: [{
        field: 'tag',
        relation: '=',
        key: eventId,
        value: '1',
      }],
    });

    notifications
      .send(notification)
      .then((result) => console.log(result.toString()))
      .catch((error) => console.error(error));
  };
}
