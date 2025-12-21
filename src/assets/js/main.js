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
    // 3. Smooth Scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            // Ignore blob: or empty links which might trigger this selector incorrectly if not careful, 
            // though selector ^="#" usually protects against non-hash.
            // The error 'blob:...' suggests the selector logic or a link structure became invalid because a download link (blob:...) 
            // might have been treated as an anchor if it had a hash or logic fail.
            // But the user error says 'blob:...' is not a valid selector. This implies something passed 'blob:...' to querySelector.
            // This happens if a[href^="#"] matches something it shouldn't, or logical fallthrough.

            // Actually, the error `blob:https://...` means `this.getAttribute('href')` returned a blob URL.
            // But `a[href^="#"]` should ONLY select hrefs starting with #.
            // However, if the user error is exact, maybe they have `href="#something"` but then JS changes it?
            // OR, more likely, the error is elsewhere or I should guard against it.

            if (targetId && targetId.startsWith('#') && targetId.length > 1) {
                e.preventDefault();
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});
