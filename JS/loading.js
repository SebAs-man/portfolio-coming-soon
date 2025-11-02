//* ===========================
//        LOADING SCREEN
// =========================== */
document.addEventListener('DOMContentLoaded', function(){
    const loading_screen = document.getElementById('loading-screen');
    const main_screen = document.getElementById('main-content');
    const loading_bar = document.getElementById('loading-bar');
    const loading_percentage = document.getElementById('loading-percentage');
    const fuzzyCanvas = document.getElementById('fuzzy-canvas');

    const vt323 = new FontFace('VT323', 'url(./fonts/VT323/VT323-Regular.ttf)');
    let fuzzyText;
    vt323.load().then((loadedFace) => {
        document.fonts.add(loadedFace);

        fuzzyText = new FuzzyText(fuzzyCanvas, 'CONNECTING', {
            fontSize: 6,
            fontWeight: 400,
            fontFamily: "VT323, monospace",
            color: '#00FF41',
            baseIntensity: 0.2,
            hoverIntensity: 0.5
        });
    });

    let progress = 0;
    let lastProgress = 0;
    const progressStages = [
        { until: 20, speed: 8, variance: 4 },
        { until: 45, speed: 5, variance: 3 },
        { until: 70, speed: 4, variance: 2 },
        { until: 85, speed: 3, variance: 1.5 },
        { until: 99, speed: 1, variance: 0.8 }
    ];

    function getProgressIncrement() {
        for (let stage of progressStages) {
            if (progress < stage.until) {
                const randomFactor = (Math.random() - 0.3) * stage.variance;
                return stage.speed + randomFactor;
            }
        }
        return 0;
    }

    function updateLoadingBar() {
        if (progress < 99) {
            const increment = getProgressIncrement();
            progress = Math.min(progress + increment, 99);

            // Random glitches
            if (Math.random() < 0.15) {
                progress = Math.max(lastProgress, progress - Math.random() * 5);
                loading_bar.style.transition = 'width 0.05s linear';
            } else {
                loading_bar.style.transition = 'width 0.3s ease';
            }

            lastProgress = progress;
            loading_bar.style.width = progress + '%';
            loading_percentage.textContent = Math.floor(progress) + '%';

            const nextDelay = 100 + Math.random() * 150;
            setTimeout(updateLoadingBar, nextDelay);

        } else {
            progress = 99;
            loading_bar.style.width = '99%';
            loading_percentage.textContent = '99%';
            showWarningMessage();
            setTimeout(() => {
                startFlickerSequence();
            }, 1500);
        }
    }

    function showWarningMessage() {
        let warningDiv = document.getElementById('loading-warning');
        if (!warningDiv) {
            warningDiv = document.createElement('div');
            warningDiv.id = 'loading-warning';
            warningDiv.textContent = '⚠ WARNING: Signal degradation detected.';
            document.getElementById('loading-stats').appendChild(warningDiv);
        }
        warningDiv.classList.add('show');
    }

    function startFlickerSequence() {
        const loadingContent = document.querySelector('#loading-content');
        loading_screen.classList.add('flicker');

        setTimeout(() => {
            loading_screen.classList.remove('flicker');
            loadingContent.style.opacity = '0';

            setTimeout(() => {
                showErrorScreen();
            }, 300);
        }, 495);
    }

    function showErrorScreen() {
        const errorMessage = document.getElementById('error-message');

        errorMessage.classList.remove('hidden');
        errorMessage.classList.add('show');

        const errorLinesContainer = document.createElement('div');
        errorLinesContainer.id = 'error-lines-container';
        errorLinesContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            font-family: 'VT323', monospace;
            font-size: 5rem;
            color: #FF1744;
            text-shadow: 0 0 20px rgba(255, 23, 68, 0.8);
            line-height: 1.4;
        `;
        errorMessage.appendChild(errorLinesContainer);

        const errorLines = [
            '[ TRANSMISSION FAILURE ]\n' +
            'Probe Status: UNKNOWN\n' +
            'Mission Data: CORRUPTED',
            'ATTEMPTING RECOVERY...'
        ];

        // Mostrar líneas una por una con efecto de escritura
        typeErrorLines(errorLines, errorLinesContainer, 0, () => {
            setTimeout(() => {
                initiateSystemRecovery();
            }, 1500);
        });
    }

    function typeErrorLines(lines, container, index, callback) {
        if (index >= lines.length) {
            callback();
            return;
        }

        const lineDiv = document.createElement('canvas');
        lineDiv.className = 'error-line';
        const errorFuzzy = new FuzzyText(lineDiv, lines[index], {
            fontSize: 4,
            fontWeight: 400,
            fontFamily: 'VT323, monospace',
            color: '#FF1744',
            baseIntensity: 0.3,
            hoverIntensity: 0.7,
            multiline: true,
            lineHeight: 1.4
        });
        container.appendChild(lineDiv);

        // Encourage the appearance
        setTimeout(() => {
            lineDiv.classList.add('show');
            setTimeout(() => {
                typeErrorLines(lines, container, index + 1, callback);
            }, 800);
        }, 50);
    }

    function initiateSystemRecovery() {
        const whiteFlash = document.createElement('div');
        whiteFlash.className = 'white-flash';
        document.body.appendChild(whiteFlash);
        // White flash
        setTimeout(() => {
            whiteFlash.classList.add('active');
        }, 10);
        // TV animation
        setTimeout(() => {
            loading_screen.classList.add('tv-off');
            setTimeout(() => {
                loading_screen.style.display = 'none';
                main_screen.style.display = 'block';
                main_screen.classList.add('fade-in');
                document.body.removeChild(whiteFlash);
                // Clean resources
                fuzzyText.destroy();
            }, 1200);
        }, 100);
    }

    // Init
    updateLoadingBar();
});