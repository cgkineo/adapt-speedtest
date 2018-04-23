define([
  'core/js/adapt'
],function(Adapt) {

  var SPEED = new ENUM([
    "UNKNOWN",
    "SLOW",
    "FAST"
  ]);

  var SpeedTest = Backbone.Controller.extend({

    $html: $("html"),

    assets: [
      {
        bytes: 122,
        src: "assets/speedtest/image-0.png"
      },
      {
        bytes: 40836,
        src: "assets/speedtest/image-4.png"
      },
      {
        bytes: 381756,
        src: "assets/speedtest/image-6.png"
      }
    ],

    initialize: function() {
      _.bindAll(this, "onDataLoaded", "checkRepeat", "_nextImage", "_imageErrored", "_imageLoaded", "_runCallbacks");
      this.setSpeed(SPEED.SLOW);
      this.listenToOnce(Adapt, 'configModel:dataLoaded', this.onDataLoaded);
    },

    onDataLoaded: function() {

      this.config = Adapt.config.get("_speedtest");
      if (!this.config || this.config._force || !this.config._isEnabled) {
        var forceSpeed = SPEED(this.config && this.config._force && this.config._force.toUpperCase());
        return this.setSpeed(forceSpeed || SPEED.SLOW, 0);
      }

      Adapt.config.set("_canLoadData", false);

      this.test(function() {
        Adapt.config.set("_canLoadData", true);
        Adapt.trigger('configModel:loadCourseData');
        this.checkRepeat();
      }.bind(this));

    },

    checkRepeat: function() {

      if (!this.config._repeatSeconds) return;

      _.delay(function() {
        this.test(this.checkRepeat);
      }.bind(this), this.config._repeatSeconds * 1000);

    },

    speed: SPEED.UNKNOWN,
    bps: 0,
    setSpeed: function(speed, bps) {

      this.bps = bps;
      if (this.speed === speed) return;

      this.speed = speed;
      switch(speed) {
        case SPEED.SLOW:
          this.$html.addClass("speed-slow").removeClass("speed-fast");
          break;
        case SPEED.FAST:
          this.$html.addClass("speed-fast").removeClass("speed-slow");
          break;
      }

      Adapt.trigger("network:change", speed);

    },

    setRates: function(slowThreshold, currentSpeed) {

      slowThreshold = slowThreshold || "1mb";
      currentSpeed = currentSpeed || "0.6mb";

      var slowThresholdbitsps = this.textSizeToBytes(slowThreshold) * 8;
      var currentSpeedbitsps = this.textSizeToBytes(currentSpeed) * 8;
      var isBelowSlowThreshold = (currentSpeedbitsps <= slowThresholdbitsps);
      var speed = isBelowSlowThreshold ? SPEED.SLOW : SPEED.FAST;

      Adapt.log.debug("Speedtest -", speed.asString, "threshold:", slowThreshold, "predicted speed:", currentSpeed);

      this.$html.attr({
        'data-speed': currentSpeed+"/s"
      });

      this.setSpeed(speed, currentSpeedbitsps);

    },

    _inTest: false,
    _callbacks: [],
    _testStart: 0,
    _latency: 0,
    test: function(callback) {

      this._callbacks.push(callback);
      if (this._inTest) return;

      this._startTest();

    },

    _assetIndex: 0,
    _img: null,
    _startTest: function() {

      this._assetIndex = 0;
      this._inTest = true;
      this._latency = 0;

      _.delay(this._nextImage, 500);
    },

    _nextImage: function() {
      var asset = this.assets[this._assetIndex];
      asset.startTime = Date.now();
      $.ajax({
        url: asset.src + "?q=" + asset.startTime,
        success: this._imageLoaded,
        error: this._imageErrored
      });
    },

    _imageErrored: function() {

      var slowThresholdBps = this.textSizeToBytes(this.config._slowThreshold || "1mb");
      var slowThresholdMbps = this.bytesSizeToString(slowThresholdBps, "mb");
      var predictedConnectionSpeedMbps = this.bytesSizeToString(0, "mb");
      this.setRates(slowThresholdMbps, predictedConnectionSpeedMbps);

      this._runCallbacks();

    },

    _imageLoaded: function() {

      var asset = this.assets[this._assetIndex];
      asset.endTime = Date.now();
      asset.totalDuration = (asset.endTime - asset.startTime) / 1000;

      if (this._assetIndex === 0) {
        this._latency = this.assets[0].totalDuration/2;
      }

      if (asset.totalDuration < this._latency) {
        this._latency = asset.totalDuration/2;
      }


      var totalDuration = 0;
      var adjustedDuration = 0;
      var totalBytes = 0;
      for (var i = 0; i <= this._assetIndex; i++) {
        var tempAsset = this.assets[i];
        tempAsset.adjustedDuration = tempAsset.totalDuration-this._latency;
        if (tempAsset.adjustedDuration <= 0) {
          tempAsset.adjustedDuration = 0.001;
        }
        totalDuration+=tempAsset.totalDuration;
        adjustedDuration+=tempAsset.adjustedDuration;
        totalBytes+=tempAsset.bytes;
      }

      var predictedConnectionSpeedBps = (totalBytes/adjustedDuration);
      var lastItemPredictedConnectionSpeedBps = (this.assets[this._assetIndex].bytes / this.assets[this._assetIndex].adjustedDuration);
      var averagePredictedConnectionSpeedBps = (predictedConnectionSpeedBps+(lastItemPredictedConnectionSpeedBps*4)) / 5;

      this._assetIndex++;
      var isTakingTooLong = (this._assetIndex === 2 && totalDuration >= 0.9);
      var isTakingFarTooLong =  (totalDuration >= 2);
      var hasNoMoreAssets = (this._assetIndex >= this.assets.length);

      if (!hasNoMoreAssets && !isTakingFarTooLong && !isTakingTooLong) {
        this._nextImage();
        return;
      }

      var slowThresholdBps = this.textSizeToBytes(this.config._slowThreshold || "1mb");
      var slowThresholdMbps = this.bytesSizeToString(slowThresholdBps, "mb");
      var predictedConnectionSpeedMbps = this.bytesSizeToString(averagePredictedConnectionSpeedBps, "mb");
      this.setRates(slowThresholdMbps, predictedConnectionSpeedMbps);

      this._runCallbacks();

    },

    _runCallbacks: function () {
      this._callbacks.forEach(function(callback) {
        try {
          callback(this.speed);
        } catch (e) {}
      }.bind(this));
      this._inTest = false;
      this._assetIndex = 0;
      this._callbacks.length = 0;
    },

    textSizeToBytes: function(str) {
      str = (str+"");
      var sizes = [ "b", "kb", "mb", "gb" ];
      var sizeIndex = 0;
      var lcStr = str.toLowerCase();
      for (var i = sizes.length - 1, l = -1; i > l; i--) {
        if (lcStr.indexOf(sizes[i]) != -1) {
          sizeIndex = i;
          break;
        }
      }

      var isBytes = (str.indexOf("B") != -1);

      var multiplier = isBytes ? 1024 : 1000;
      var num = parseFloat(str);
      if (!isBytes) num/=8;

      return Math.round(num * Math.pow(multiplier, sizeIndex));;
    },

    bytesSizeToString: function(number, size) {

      var sizes = [ "b", "kb", "mb", "gb" ];
      var sizeIndex = sizes.indexOf(size.toLowerCase());
      var isBytes = (size.indexOf("B") != -1);
      var multiplier = isBytes ? 1024 : 1000;
      if (sizeIndex == -1) sizeIndex = 0;
      if (!isBytes) number*=8;

      return (Math.round( (number/ Math.pow(multiplier, sizeIndex) ) * 100) / 100) + size;
    }

  });

  Adapt.speedtest = new SpeedTest();

});
