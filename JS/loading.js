//* ===========================
//        LOADING SCREEN
// =========================== */
document.addEventListener('DOMContentLoaded', function(){
    const loading_screen = document.getElementById('loading-screen');
    const main_screen = document.getElementById('main-content');
    const loading_bar = document.getElementById('loading-bar');
    const loading_percentage = document.getElementById('loading-percentage');
    const fuzzyCanvas = document.getElementById('fuzzy-canvas');

    // Initialize fuzzy text effect
    const fuzzyText = new FuzzyText(fuzzyCanvas, 'CONNECTING', {
        fontSize: 8,
        fontWeight: 400,
        fontFamily: 'VT323, monospace',
        color: '#00FF41',
        baseIntensity: 0.2,
        hoverIntensity: 0.6
    });

    let progress = 0;
    const loading_interval = setInterval(() => {
        progress += Math.random() * 17;

        if(progress >= 99) {
            progress = 99;
            clearInterval(loading_interval);
            setTimeout(() => {
                startErrorSequence();
            }, 750);
            return;
        }
        loading_bar.style.width = progress + '%';
        loading_percentage.textContent = Math.floor(progress) + '%';
    }, 150);

    function startErrorSequence() {
        const errorMessage = document.getElementById('error-message');
        const errorCanvas = document.getElementById('error-canvas');
        const loadingContent = document.querySelector('#loading-content');

        loadingContent.style.opacity = '0';

        setTimeout(() => {
            errorMessage.classList.remove('hidden');
            errorMessage.classList.add('show');

            const errorFuzzy = new FuzzyText(errorCanvas, 'SIGNAL LOST\nPROBE STATUS: CRITICAL\nTRANSMISSION: CORRUPTED', {
                fontSize: 4,
                fontWeight: 400,
                fontFamily: 'VT323, monospace',
                color: '#FF1744',
                baseIntensity: 0.35,
                hoverIntensity: 0.8,
                multiline: true,
                lineHeight: 1.5
            });

            setTimeout(() => {
                errorMessage.classList.add('tv-off');
                setTimeout(() => {
                    loading_screen.style.display = 'none';
                    main_screen.style.display = 'block';
                    main_screen.classList.add('fade-in');
                    // Clear
                    fuzzyText.destroy();
                    errorFuzzy.destroy();
                }, 800);
            }, 2000);
        }, 300);
    }
});