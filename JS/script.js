//* ===========================
//        LOADING SCREEN
// =========================== */
document.addEventListener('DOMContentLoaded', function(){
    const loading_screen = document.getElementById('loading-screen');
    const main_screen = document.getElementById('main-content');
    const loading_bar = document.getElementById('loading-bar');
    const loading_percentage = document.getElementById('loading-percentage');

    let progress = 0;
    const loading_interval = setInterval(() => {
        progress += Math.random() * 15;
        if(progress > 100) progress = 100;
        loading_bar.style.width = progress + '%';
        loading_percentage.textContent = Math.floor(progress) + '%';

        if(progress >= 100){
            clearInterval(loading_interval);
            setTimeout(() => {
                loading_screen.style.opacity = '0';
                setTimeout(() => {
                    loading_screen.style.display = 'none';
                    main_screen.style.display = 'block';
                }, 500);
            }, 800);
        }
    }, 200);
});