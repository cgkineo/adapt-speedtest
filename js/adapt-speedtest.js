define([
    'coreJS/adapt',
    './speedtest.min',
],function(Adapt, SpeedTest) {

    speedtest.config({
        imagesURL: "assets/speedtest",
        no_wait_for_document: 1,
    });

    Adapt.once('configModel:dataLoaded', function(view) {

        if (Adapt.config.get("_speedtest") && Adapt.config.get("_speedtest")._isEnabled === false) {
            speedtest.low_kbps = speedtest.kbps = 100000000;
            speedtest.low_name = speedtest.name = "fast";
            $("html").removeClass("speedtest-slow").addClass("speedtest-fast");
            console.log("speedtest disabled", speedtest.name, speedtest.kbps);
            return;
        }

        Adapt.config.set('_canLoadData', false);

        speedtest.test(function(name, kbps) {
            console.log("speedtest enabled", name, kbps);
            _.defer(function() {
                Adapt.trigger('configModel:loadCourseData');
            });
        });

    });

});
