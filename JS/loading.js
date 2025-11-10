//* ===========================
//        LOADING SCREEN
// =========================== */
document.addEventListener('DOMContentLoaded', function(){
    const loading_screen = document.getElementById('loading-screen');
    const main_screen = document.getElementById('main-content');
    const loading_bar = document.getElementById('loading-bar');
    const loading_percentage = document.getElementById('loading-percentage');
    const fuzzyCanvas = document.getElementById('fuzzy-canvas');

    let fuzzyText, fuzzyPercentage;
    let dotsInterval, recoveryDotsInterval;

    // Load font and initialize
    const vt323 = new FontFace('VT323', 'url(./fonts/VT323/VT323-Regular.ttf)');
    vt323.load().then((loadedFace) => {
        document.fonts.add(loadedFace);
        initializeLoadingScreen();
    }).catch(() => {
        initializeLoadingScreen();
    })

    function initializeLoadingScreen() {
        const loadingContent = document.getElementById('loading-content');
        if (loadingContent) {
            loadingContent.classList.add('tv-on');
        }
        fuzzyText = new FuzzyText(fuzzyCanvas, 'CONNECTING to \nSEBASMAN PAGE', {
            fontSize: 5,
            fontWeight: 400,
            fontFamily: 'VT323, monospace',
            multiline: true,
            color: '#16F284',
            baseIntensity: 0.2,
            hoverIntensity: 0.5,
            enableHover: true
        });
        createFuzzyPercentage();
        setTimeout(() => {
            updateLoadingBar();
        }, 500);
    }

    function createFuzzyPercentage() {
        const percentageCanvas = document.createElement('canvas');
        percentageCanvas.id = 'percentage-canvas';

        const statsDiv = document.getElementById('loading-stats');
        if (!statsDiv) {
            const newStatsDiv = document.createElement('div');
            newStatsDiv.id = 'loading-stats';
            const barContainer = document.getElementById('loading-bar-container');
            barContainer.parentNode.insertBefore(newStatsDiv, barContainer.nextSibling);
            newStatsDiv.appendChild(percentageCanvas);
        } else {
            statsDiv.appendChild(percentageCanvas);
        }

        const oldPercentage = document.getElementById('loading-percentage');
        if (oldPercentage) {
            oldPercentage.remove();
        }

        fuzzyPercentage = new FuzzyText(percentageCanvas, '0%', {
            fontSize: 2.5,
            fontWeight: 400,
            fontFamily: 'VT323, monospace',
            color: '#16F284',
            baseIntensity: 0.2,
            hoverIntensity: 0.5
        });
    }

    /**
     * Animates the ellipsis
     */
    function animateDots(fuzzyTextInstance, baseText) {
        const dotStates = ['', '.', '..', '...'];
        let currentDotIndex = 0;

        return setInterval(() => {
            const newText = baseText + dotStates[currentDotIndex];
            fuzzyTextInstance.updateText(newText);
            currentDotIndex = (currentDotIndex + 1) % dotStates.length;
        }, 350);
    }

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

            if (Math.random() < 0.15) {
                progress = Math.max(lastProgress, progress - Math.random() * 5);
                loading_bar.style.transition = 'width 0.05s linear';
                loading_bar.classList.add('glitch');
                setTimeout(() =>{
                    loading_bar.classList.remove('glitch');
                }, 400)
            } else {
                loading_bar.style.transition = 'width 0.3s ease';
            }

            lastProgress = progress;
            loading_bar.style.width = progress + '%';
            const percentageText = Math.floor(progress) + '%';
            fuzzyPercentage.updateText(percentageText);

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
        const loadingContent = document.getElementById('loading-content');
        if (dotsInterval) {
            clearInterval(dotsInterval);
        }
        if (loadingContent) {
            loadingContent.classList.add('tv-off');
        }
        setTimeout(() => {
            if (loadingContent) {
                loadingContent.style.opacity = '0';
                loadingContent.style.display = 'none';
            }
            showErrorScreen();
        }, 500);
    }

    function showErrorScreen() {
        const errorMessage = document.getElementById('error-message');
        if(errorMessage){
            errorMessage.classList.add('tv-on');
        }

        const errorLines = [
            '[ TRANSMISSION FAILURE ]\n' +
            'Probe Status: UNKNOWN\n' +
            'Mission Data: CORRUPTED\n',
            'ATTEMPTING RECOVERY...'
        ];

        typeErrorLines(errorLines, errorMessage, 0, () => {
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
        const hasEllipsis = lines[index].includes('...');
        const baseText = hasEllipsis ? lines[index].replace('...', '') : lines[index];

        const errorFuzzy = new FuzzyText(lineDiv, lines[index], {
            fontSize: 4,
            fontWeight: 400,
            fontFamily: 'VT323, monospace',
            color: '#F2C849',
            baseIntensity: 0.3,
            hoverIntensity: 0.7,
            multiline: true,
            lineHeight: 1.4,
            enableHover: true
        });
        container.appendChild(lineDiv);

        if (hasEllipsis && index === lines.length - 1) {
            recoveryDotsInterval = animateDots(errorFuzzy, baseText);
        }

        // Encourage the appearance
        setTimeout(() => {
            lineDiv.classList.add('show');
            setTimeout(() => {
                typeErrorLines(lines, container, index + 1, callback);
            }, 800);
        }, 150);
    }

    function initiateSystemRecovery() {
        const errorMessage = document.getElementById('error-message');
        if (recoveryDotsInterval) {
            clearInterval(recoveryDotsInterval);
        }

        const whiteFlash = document.createElement('div');
        whiteFlash.className = 'white-flash';
        document.body.appendChild(whiteFlash);
        // White flash
        setTimeout(() => {
            whiteFlash.classList.add('active');
        }, 10);
        // TV animation
        setTimeout(() => {
            errorMessage.classList.add('tv-off');
            setTimeout(() => {
                loading_screen.style.display = 'none';
                main_screen.style.display = 'grid';
                main_screen.classList.add('fade-in');
                document.body.removeChild(whiteFlash);
                // Clean resources
                if (fuzzyText) fuzzyText.destroy();
                if (fuzzyPercentage) fuzzyPercentage.destroy();
                const errorCanvases = document.querySelectorAll('.error-line');
                errorCanvases.forEach(() => {
                });
            }, 750);
        }, 500);
    }
});