/*!
 * atraxi
 * Copyright(c) 2016 Anatol Sommer <anatol@anatol.at>
 * MIT Licensed
 */

'use strict';

var TelegramBot=require('node-telegram-bot-api'),
  async=require('async'), request=require('request');
 
function Atraxi(tgToken, tgOpts) {
  tgOpts=tgOpts || {polling:true};
  this._notify=[];
  this._interval=60000;
  this._setupBot();
}

Atraxi.prototype.responseText='hi!';

Atraxi.prototype.notify=function(ids) {
  if (!ids) {
    console.error('Usage: .notify(1234) or .notify([1234,2345])');
    return;
  }
  ids=(!(ids instanceof Array) ? [ids] : ids);
  this._notify=ids.map(Number);
  return this;
};

Atraxi.prototype.check=function(urls, intervalSeconds) {
  if (!urls) {
    console.error('Usage: .check([\'http:...\', \'http:...\'])');
    return;
  }
  urls=(typeof urls==='string' ? [urls] : urls);
  this._urls=urls;
  this._interval=intervalSeconds*1000 || this._interval;
  process.nextTick(this._reset.bind(this));
  return this;
};

Atraxi.prototype.every=function(intervalSeconds) {
  this._interval=intervalSeconds*1000;
  return this;
};


Atraxi.prototype._setupBot=function() {
  var resp=this.responseText, bot;

  this.bot=bot=new TelegramBot(tgToken, tgOpts);

  bot.on('message', function(msg) {
    var chatId=msg.chat.id;
    if (msg.text.substr(0, 3)==='/id') {
      bot.sendMessage(chatId, 'ID: '+msg.from.id);
    } else {
      bot.sendMessage(chatId, resp);
    }
  });
};

Atraxi.prototype._reset=function() {
  clearInterval(this._timeout);
  this._check();
};

Atraxi.prototype._check=function() {
  var self=this, urls=this._urls, users=this._notify, bot=this.bot;
  async.mapSeries(urls, function checkUrl(url, cb, retry) {
    request(url, function(err, res) {
      res=res || {};
      if (!retry && err) {
        setTimeout(function() {
          checkUrl(url, cb, true);
        }, 2000);
      } else {
        cb(null, {url:url, err:err, code:res.statusCode});
      }
    });
  }, function(err, responses) {
    var failed;
    self._timeout=setTimeout(self._check.bind(self), self._interval);
    if (err) {
      console.error('Error requesting page\n', err.stack);
      return;
    }
    failed=responses.filter(function(res) {
      return res.err || res.code!==200;
    });
    if (failed.length) {
      failed=failed.map(function(fail) {
        var msg=(fail.err ? fail.err.message : 'HTTP '+fail.code);
        return '⚠ '+fail.url+'\n'+msg;
      }).join('\n\n');
      users.forEach(function(id) {
        bot.sendMessage(id, failed);
      });
    }
  });
};

module.exports=Atraxi;
