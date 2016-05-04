'use strict';

let util = require('util'),
  http = require('http'),
  Bot  = require('@kikinteractive/kik'),
  Mixpanel = require('mixpanel'),
  config = require('./config'),
  request = require('request');

var mixpanel = Mixpanel.init(config.mixPanelAPI);

// Configure the bot API endpoint, details for your bot

let bot = new Bot({
  username: config.username,
  apiKey: config.apiKey,
  baseUrl: config.baseUrl
});

let options = ['Recent sound', 'Random sound', 'Learn more'];

bot.updateBotConfiguration();

bot.onStartChattingMessage((message) => {
  bot.getUserProfile(message.from).then((user) => {
    message.reply(`Hey ${user.firstName}!`);
    message.addResponseKeyboard(options, true);
  });
});

bot.onTextMessage((message) => {
  var myMessage = Bot.Message

  if (message.body == "Recent sound") {
    mixpanel.track('recent_sound');
    sendRecent(message.from);
  } else if (message.body == "Random sound") {
    mixpanel.track('random_sound');
    sendRandom(message.from);
  } else if (message.body == "Learn more") {
    mixpanel.track('learn_more');
    myMessage = myMessage.text("I'm so happy you want to learn more about FoundSounds! I am a bot.");
    sendInfo(message.from);
  } else {
    mixpanel.track('generic_message');
    myMessage = myMessage.text("Hi! I can send you sounds or tell you more about FoundSounds!");
    myMessage.addResponseKeyboard(options, false);
    message = message.reply(myMessage);
  }
});

function sendRecent(sendTo) {
  var myMessage = Bot.Message.text("Finding a recent sound!");
  //myMessage.addResponseKeyboard([], false);
  setTimeout(function() {
    bot.send(myMessage, sendTo);
  }, 300);

  var url = "https://foundsounds.me/api/recent";
  request({
    url: url,
    json: true
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var foundSound = false;
      var i = 0;
      while (foundSound == false) {
        if (body[i].photo_id > 0) {
          sendSound(sendTo, body[i]);
          foundSound = true;
        }
        i++;
      }
    }
  });
}

function sendRandom(sendTo) {
  var myMessage = Bot.Message.text("Finding a random sound!");
  //myMessage.addResponseKeyboard([], false);
  setTimeout(function() {
    bot.send(myMessage, sendTo);
  }, 300);

  var url = "https://foundsounds.me/api/recent";
  request({
    url: url,
    json: true
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var foundSound = false;
      while (foundSound == false) {
        let i = Math.floor((Math.random() * 100) + 1);
        if (body[i].photo_id > 0) {
          sendSound(sendTo, body[i]);
          foundSound = true;
        }
      }
    }
  });
}

function sendSound(sendTo, sound) {
  var fsLink = Bot.Message.link(`https://foundsounds.me/listen/${sound.username}/${sound.soundID}`).setTitle('FoundSounds');

  if (sound.description != '') {
    fsLink.setText(sound.description);
  }

  if (sound.photo_id != "" && sound.photo_id > 0) {
    fsLink.setPicUrl(`https://foundsounds.me/${sound.trackCover}`);
  }

  /*
  .setPicUrl('https://foundsounds.me/ci-images/header-bg.jpg');
  */
  fsLink.addResponseKeyboard(options, false);
  bot.send(fsLink, sendTo);
}

function sendInfo(sendTo) {
  var myMessage = Bot.Message.text("FoundSounds is a collective art project in the form of a social network. Users find and record sounds they find interesting to share with one another.");
  myMessage.addResponseKeyboard(options, false);

  setTimeout(function() {
    bot.send(myMessage, sendTo);
  }, 300);

  var fsLink = Bot.Message.link('https://foundsounds.me').setTitle('FoundSounds').setText('Find Sounds. Share Sounds.').setPicUrl('https://foundsounds.me/ci-images/header-bg.jpg');
  fsLink.addResponseKeyboard(options, false);

  setTimeout(function() {
    bot.send(fsLink, sendTo);
  }, 1000);

}


// Set up your server and start listening
let server = http
    .createServer(bot.incoming())
    .listen(process.env.PORT || 8080);
