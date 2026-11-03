

(async function () {
    let isMobile = isMobileCheck();
    let successCount = 0;
    let slowLogged = false;
    let reloadLogged = false;
    let loadErrorLogged = false;

    window.appInitStage = 1;

    function isMobileCheck() {
        function iOS() {
            return [
                'iPad Simulator',
                'iPhone Simulator',
                'iPod Simulator',
                'iPad',
                'iPhone',
                'iPod'
            ].includes(navigator.platform)
                // iPad on iOS 13 detection
                || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
        }

        return iOS() || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    if (/bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent)) {
        document.body.style.minWidth = "100px";

        document.getElementById('sidebar').remove();
        document.getElementById('splashScreen').remove();
        document.getElementById('pageSSRContent').style.display = 'block';
        document.getElementById('pageSSRContent').style.opacity = 1;

        return;
    }

    if (isMobile) {
        // Set existing viewport meta tag to 1200px width
        const viewportMetaTag = document.querySelector('meta[name="viewport"]');
        if (viewportMetaTag) {
            viewportMetaTag.setAttribute('content', 'width=1200');
        }
    }

    if (document.getElementById('pageSSRContent')) {
        // remove all images from #pageSSRContent because they are not needed
        const images = document.querySelectorAll('#pageSSRContent img');
        images.forEach(img => {
            img.remove();
        });

        // set pageSSRContent visible with opacity 0.0001 to improve PageSpeed Insights
        document.getElementById('pageSSRContent').style.opacity = 0.0001;
        document.getElementById('pageSSRContent').style.display = 'block';
        document.getElementById('pageSSRContent').addEventListener('click', function (event) {
            event.stopPropagation();
            event.preventDefault();
        });
    }

    window.appInitStage = 2;

    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            window.addEventListener('load', resolve);
            setTimeout(resolve, 500); // Fallback to resolve after 500ms
        })
    }

    window.appInitStage = 3;

    const parallelScripts = [
        '/js/guard/obf/trc.js',
        '/js/lib-bundle.min.js',
    ];

    // mobile scripts
    if (isMobile) {
        parallelScripts.push('/js/audiofix.js');
        parallelScripts.push('/js/mobilePromo.js');
    }

    const sequentialScripts = [];

    if (navigator.language.includes('de') || localStorage.getItem('setting_lang') === 'de') {
        sequentialScripts.push('/dx/js/dxde.js');
    }

    sequentialScripts.push('/combo/app.js');

    function updateFilesLoadingStatus() {
        if (window.hasErrors) {
            return;
        }
        document.getElementsByClassName('loadingStatus')[0].innerText = "Loading file " + successCount + " of " + (parallelScripts.length + sequentialScripts.length);
        successCount++;
    }


    function onJsLoadError(src, error) {
        window.hasErrors = true;
        console.error(`Failed to load script: ${src}`, error);
        document.getElementsByClassName('loadingSpinner')[0].style.display = "none";
        document.getElementsByClassName('loadingStaticText')[0].innerHTML = "";
        document.getElementsByClassName('loadingStatus')[0].innerHTML = `
            <h2>${error.message}</h2>
            <pre>File: ${src}</pre>
        `;

        if (!window.location.href.includes('reload=1')) {
            if (!reloadLogged) {
                reloadLogged = true;
                logInitError({ event: 'APP_INIT_TRY_RELOAD' });
            }

            setTimeout(() => {
                window.location.search = 'reload=1&t=' + Date.now();
            }, 2000);
        }
    }

    function onSlowJsLoad(src) {
        window.hasErrors = true;
        console.warn(`Script loading is taking longer than expected: ${src}`);
        document.getElementsByClassName('loadingStaticText')[0].innerHTML = "";
        document.getElementsByClassName('loadingStatus')[0].innerHTML = `
            <h2>Slow Network</h2>
            <pre>Loading: ${src}. Please wait...</pre>
        `;
    }


    /**
     * Loads a script by inserting a <script> tag.
     * Rejects if the script errors or takes longer than 10 seconds.
     * @param {string} src - URL of the script to load.
     * @param {Object} options
     * @param {boolean} options.async - whether to set script.async (default: true)
     * @returns {Promise<string>}
     */
    function loadScript(src, { async = true } = {}) {
        return new Promise((resolve, reject) => {
            const isReload = window.location.search.includes('reload=1');
            const script = document.createElement('script');
            script.src = src + (isReload ? ('?t=' + Date.now()) + '&bc=1' : '');
            script.async = isReload ? false : async;

            // Timeout after 15 seconds
            const slowTimeoutId = setTimeout(() => {
                onSlowJsLoad(src);
                if (!slowLogged) {
                    slowLogged = true;
                    logInitError({ event: 'APP_INIT_SLOW', file: src });
                }
            }, 7_000);

            const hardTimeoutId = setTimeout(() => {
                onJsLoadError(src, new Error('Script Load Timeout'));

                if (!loadErrorLogged) {
                    loadErrorLogged = true;
                    logInitError({ event: 'APP_INIT_TIMEOUT', file: src, async, isReload });
                }

                reject(new Error(`Timeout loading: ${src}`));
            }, 30_000);

            script.onload = () => {
                updateFilesLoadingStatus();
                clearTimeout(slowTimeoutId);
                clearTimeout(hardTimeoutId);
                resolve(src);

                if (typeof window.scriptCountLoaded === 'number') {
                    window.scriptCountLoaded += 1;
                }
            };

            script.onerror = (evt) => {
                clearTimeout(slowTimeoutId);
                clearTimeout(hardTimeoutId);
                onJsLoadError(src, evt.error || new Error('Script Load Error'));

                if (!loadErrorLogged) {
                    loadErrorLogged = true;
                    logInitError({ event: 'APP_INIT_ERROR', file: src, async, isReload, error: evt.error });
                }

                reject(new Error(`Error loading: ${src}`));

                if (typeof window.scriptCountFailed === 'number') {
                    window.scriptCountFailed += 1;
                }
            };

            document.head.appendChild(script);
        });
    }

    const parallelStyles = [
        'https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap',
        'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css',
        '/flag-icons/css/flag-icons.min.css',
        '/combo/modules.css',
        '/combo/ui.css',
        '/dx/css/dxdark.css',
    ]

    // append stylesheets
    parallelStyles.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = src;
        document.head.appendChild(link);
    });

    window.scriptCountTotal = parallelScripts.length + sequentialScripts.length;
    window.scriptCountLoaded = 0;
    window.scriptCountFailed = 0;

    // Load all parallel scripts first
    Promise.all(parallelScripts.map(src => loadScript(src, { async: true })))
        .then(loadedList => {
            console.log('Parallel loaded:', loadedList);

            // Then load sequential scripts one by one
            return sequentialScripts.reduce((chain, src, idx) => {
                return chain
                    .then(() => loadScript(src, { async: false }))
                    .then(() => console.log(`Sequentially loaded [${idx + 1}/${sequentialScripts.length}]: ${src}`));
            }, Promise.resolve());
        })
        .then(() => {
            console.log('All scripts loaded successfully');
        })
        .catch(err => {
            console.error('Script loading process encountered an error:', err);
        });

    window.appInitStage = 4;
})();