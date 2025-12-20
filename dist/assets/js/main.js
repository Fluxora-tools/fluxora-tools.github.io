// Main JS
console.log('Fluxora loaded. Secure & Client-Side.');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Language Preference Persistence
    // If user manually switches, we trust the URL. 
    // But if they land on root or use a generic link, we could redirect (optional for static, usually server config).
    // Here we just save preference on switch click.

    const langSwitch = document.querySelector('.lang-switch a');
    if (langSwitch) {
        langSwitch.addEventListener('click', (e) => {
            // Save preference
            const targetLang = langSwitch.innerText.toLowerCase() === 'en' ? 'en' : 'tr';
            localStorage.setItem('fluxora-lang', targetLang);
        });
    }

    // 2. Add entrance animations if not natively handled by CSS
    const main = document.querySelector('main');
    main.classList.add('animate-fade-in');

    // 3. Smooth Scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#') && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});
