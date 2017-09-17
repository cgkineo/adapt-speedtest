# adapt-speedtest

An extension which facilitates connection speed detection.  

Adds ``speedtest-offline``, ``speedtest-slow`` or ``speedtest-fast`` to the ``html`` tag.  

Triggers ``'network:change'`` event when the lowest reported bitrate changes.

Usage:

config.json
```json
"_speedtest": {
  "_isEnabled": true,
  "_force": "slow|fast",
  "_offlineThreshold": "0.4mb/s",
  "_slowThreshold": "1mb/s",
  "_repeatSeconds": 30
}
```

```
Adapt.on('network:change', function(speed) {

  switch (speed) {
    case speed.ENUM.OFFLINE: // kbps < 400 very slow 3g
      break;
    case speed.ENUM.SLOW: // kbps <= 1000 which is <= fast 3g
      break;
    case speed.ENUM.FAST: // kbps > 1000 which is >= dsl
      break;
  }

});
```


Uses library [https://github.com/cgkineo/speedtest](https://github.com/cgkineo/speedtest)
