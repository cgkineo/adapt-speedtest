# adapt-speedtest

An extension which facilitates connection speed detection.  

Adds ``speedtest-offline``, ``speedtest-slow`` or ``speedtest-fast`` to the ``html`` tag.  

Triggers 'network:change' when the lowest reported bitrate changes.


The threshold for fast is > 1mb/s.  

Usage:

```
Adapt.on('network:change', function(name, kbps) {
	
	switch (name) {
	case "offline": // kbps == 0
		break;
	case "slow": // kbps <= 1000
		break;
	case "fast": // kbps > 1000
		break;
	}

});
```


Uses library [https://github.com/cgkineo/speedtest](https://github.com/cgkineo/speedtest)
