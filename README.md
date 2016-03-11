# atraxi
HTTP monitoring with telegram bot notification


## Usage:
```js
var Atraxi=require('atraxi');

new Atraxi('telegram-bot-token')
  .check([
    'http://example.com'
    'http://example.org/test'
  ])
  .notify([1234, 2345]) // Telegram user or group IDs
  .every(30); // every 30 seconds (default = 180s)
```


## License
#### MIT

