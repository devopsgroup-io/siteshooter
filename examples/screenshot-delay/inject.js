(function() {

    function getQueryVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
    }

    function startTimer($modalBody) {

        var seconds = 0,
            minutes = 0,
            hours = 0,
            t,
            timeStamp;

        function add() {
            seconds++;
            if (seconds >= 60) {
                seconds = 0;
                minutes++;
                if (minutes >= 60) {
                    minutes = 0;
                    hours++;
                }
            }

            timeStamp = (hours ? (hours > 9 ? hours : '0' + hours) : '00') + ':' + (minutes ? (minutes > 9 ? minutes : '0' + minutes) : '00') + ':' + (seconds > 9 ? seconds : '0' + seconds);

            console.log(timeStamp);

            $modalBody.html(timeStamp);

            timer();
        }

        function timer() {
            t = setTimeout(add, 1000);
        }

        timer();
    }

    if (typeof(jQuery) !== 'undefined') {

        jQuery(document).ready(function() {

            var siteshooter = window.siteshooter || {};

            var pageName = getQueryVariable('name'),
                pageEvent = getQueryVariable('pevent'),
                pageHash = document.location.hash,
                viewportsTotal = siteshooter.viewportsTotal || 0,
                viewportsCurrent = siteshooter.viewportsCurrent || 0,
                viewportLast = viewportsCurrent === 0 ? true : false;

            // production or Salesforce UAT site?
            if (window.location.host.indexOf('visual.force') === -1) {
                pageName = window.location.pathname.replace('/', '');
            }

            console.log('Document readyState:', document.readyState);
            console.log('userAgent', navigator.userAgent);
            console.log('Page: ', pageName);
            console.log('Page Event: ', pageEvent);
            console.log('Page Hash: ', pageHash);
            console.log('Total Viewports: ', viewportsTotal);
            console.log('Current Viewport: ', viewportsCurrent);
            console.log('Last Viewport: ', viewportLast);


            // open modal
            jQuery('a[data-target=#modal-privacy]').trigger('click');

            // update modal title
            jQuery('.modal-title').text('Screenshot Delay Example:');

            // pass jQuery modal selector and start timer
            startTimer(jQuery('#modal-privacy .modal-body'));

        });

    }

})();
