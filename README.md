# adapt-speedtest

An extension which facilitates connection speed detection.  

### Usage

#### html tag
Adds ``speed-offline``, ``speed-slow`` or ``speed-fast`` to the ``html`` tag.  

#### config.json
```json
"_speedtest": {
  "_isEnabled": true,
  "_force": "slow|fast",
  "_offlineThreshold": "0.4mb/s",
  "_slowThreshold": "1mb/s",
  "_repeatSeconds": 30
}
```

#### javascript
Triggers ``'network:change'`` event when changing between offline, slow and fast modes.
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
