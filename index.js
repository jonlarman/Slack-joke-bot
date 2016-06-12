var Botkit = require('botkit')

var token = process.env.SLACK_TOKEN

var controller = Botkit.slackbot({
  // reconnect to Slack RTM when connection goes bad
  retry: Infinity,
  debug: false
})

// Assume single team mode if we have a SLACK_TOKEN
if (token) {
  console.log('Starting in single-team mode')
  controller.spawn({
    token: token
  }).startRTM(function (err, bot, payload) {
    if (err) {
      throw new Error(err)
    }

    console.log('Connected to Slack RTM')
  })
  // Otherwise assume multi-team mode - setup beep boop resourcer connection
} else {
  console.log('Starting in Beep Boop multi-team mode')
  require('beepboop-botkit').start(controller, { debug: true })
}

controller.on(['bot_channel_join', 'bot_group_join'], function (bot, message) {
  var welcome = 'AuditBot, roll out! \n' +
    'I\'m your friendly neighborhood auditbot.\n' +
    'My job is to make your life easier, by reminding you of all the things you need to do, but can\'t.\n' +
    'Together, we\'ll achieve a work-free workplace!\n' +
    bot.reply(message, welcome)
})

controller.hears(['hello', 'hi', 'hey', 'howdy'], ['direct_mention'], function (bot, message) {
  bot.reply(message, 'Hello. How can I audit you today?')
})

controller.hears(['hello', 'hi', 'hey', 'howdy'], ['direct_message'], function (bot, message) {
  bot.reply(message, 'Hello.')
  bot.reply(message, 'Ready to enforce compliance.')
})

controller.hears('', ['mention'], function (bot, message) {
  bot.reply(message, 'AuditBot is always listening. And watching.')
})

controller.hears('auditbot', ['ambient'], function (bot, message) {
  bot.reply(message, 'AuditBot is always listening. And watching.')
})

controller.hears(['permissions', 'permission'], ['ambient', 'mention', 'direct_mention', 'direct_message'], function (bot, message) {
  bot.reply(message, 'Users should not have access to do things. Neither should devs. Or support staff. \n Permission denied.')
})

controller.hears(['sql'], ['ambient', 'mention', 'direct_mention', 'direct_message'], function (bot, message) {
  bot.reply(message, 'SQL should not be used by anyone. Doing so could cause you to change things. This is not allowed.')
})

controller.hears(['audit something'],['message_recieved'],function(bot, message) {
  bot.startConversation(message, askTopic)
})

askTopic = function(response, convo) {
  convo.ask('Greetings, <@' + message.user + '>. What would you like me to audit?', function(response, convo) {
    convo.say('Okey dokey. You asked me to audit ' + response + '.')
    askHowMuch(response, convo);
    convo.next();
  });
}
askHowMuch = function(response, convo) {
  convo.ask('How much should I audit ' + response + '?', function(response, convo) {
    convo.say('Ok. You want me to audit it this much: ' + response + '.')
    askWhen(response, convo);
    convo.next();
  });
}
askWhen = function(response, convo) { 
  convo.ask('So when should I start?', [
      {
        pattern: ['now', 'right away'],
        callback: function (response, convo) {
          convo.say('Ok, I\'ll get started now.');
          convo.next();
        }
      },
      {
        pattern: ['later', 'next week', 'tomorrow'],
        callback: function (response, convo) {
          convo.say('Ok, I\'ll get started later then.');
          // do something else...
          convo.next();

        }
      },
      {
        pattern: [bot.utterances.no, 'never'],
        callback: function (response, convo) {
          convo.say('Ah man, you got me all excited.');
          // do something else...
          convo.next();
        }
      }
    ]);
}

controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
  var help = 'I will respond to the following messages: \n' +
    '`bot hi` for a simple message.\n' +
    '`bot attachment` to see a Slack attachment message.\n' +
    '`@<your bot\'s name>` to demonstrate detecting a mention.\n' +
    '`bot help` to see this again.'
  bot.reply(message, help)
})

controller.hears(['attachment'], ['direct_message', 'direct_mention'], function (bot, message) {
  var text = 'Beep Beep Boop is a ridiculously simple hosting platform for your Slackbots.'
  var attachments = [{
    fallback: text,
    pretext: 'We bring bots to life. :sunglasses: :thumbsup:',
    title: 'Host, deploy and share your bot in seconds.',
    image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
    title_link: 'https://beepboophq.com/',
    text: text,
    color: '#7CD197'
  }]

  bot.reply(message, {
    attachments: attachments
  }, function (err, resp) {
    console.log(err, resp)
  })
})

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  bot.reply(message, 'Sorry <@' + message.user + '>, I don\'t understand. \n')
})
