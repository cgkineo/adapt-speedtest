define([
    'coreJS/adapt',
    './speedtest.min',
],function(Adapt, SpeedTest) {

    speedtest.config({
        imagesURL: "assets/speedtest",
        no_wait_for_document: 1,
        interval: 20000, // milliseconds between checks (20sec)
        sample_age: 60000, // take lowest speed in latest timeslice (1min)
        idle_timeout: 60000, // time before idle state (1min)
        offline_threshold_kbps: 0,
        slow_threshold_kbps: 2000,
    });

    Adapt.once('configModel:dataLoaded', function(view) {

        if (Adapt.config.get("_speedtest") && Adapt.config.get("_speedtest")._isEnabled === false) {
            speedtest.low_kbps = speedtest.kbps = 100000000;
            speedtest.low_name = speedtest.name = "fast";
            $("html").removeClass("speedtest-slow").addClass("speedtest-fast");
            console.log("speedtest disabled", speedtest.name, speedtest.kbps);
            return;
        }

        var url = document.createElement("a");
        url.href = window.location.href;
        if (url.search.indexOf("speedtest=slow") > -1) {
            speedtest.low_kbps = speedtest.kbps = 400;
            speedtest.low_name = speedtest.name = "slow";
            $("html").addClass("speedtest-slow").removeClass("speedtest-fast");
            console.log("speedtest force", speedtest.name, speedtest.kbps);
            return;
        } else if (url.search.indexOf("speedtest=fast") > -1) {
            speedtest.low_kbps = speedtest.kbps = 100000000;
            speedtest.low_name = speedtest.name = "fast";
            $("html").removeClass("speedtest-slow").addClass("speedtest-fast");
            console.log("speedtest force", speedtest.name, speedtest.kbps);
            return;
        }


        Adapt.config.set('_canLoadData', false);

        var continued = false;

        speedtest.onchange(function(name, kbps) {
            console.log("speedtest", name, kbps);

            Adapt.trigger("network:change", name, kbps);

            if (continued) return;
            continued = true;
            _.defer(function() {
                Adapt.trigger('configModel:loadCourseData');
            });
        },{
            immediate: true, // (default: true) callback once bound
            on_rate_change: true  // (default: false) callback on kbps change and connection name change
        });

    });

});
