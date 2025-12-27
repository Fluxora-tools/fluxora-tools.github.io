const FIREBASE_URL = 'https://devbio-f42f2-default-rtdb.firebaseio.com/processcount.json';

async function fetchProcessCount() {
    try {
        const response = await fetch(FIREBASE_URL);
        const data = await response.json();
        return data || 0;
    } catch (error) {
        console.error('Error fetching process count:', error);
        return 0;
    }
}

async function updateProcessCountUI() {
    const counterElement = document.getElementById('process-count-val');
    if (!counterElement) return;

    const count = await fetchProcessCount();
    counterElement.innerText = count.toLocaleString();
}

window.incrementProcessCount = async function () {
    try {
        const currentCount = await fetchProcessCount();
        const newCount = currentCount + 1;

        await fetch(FIREBASE_URL, {
            method: 'PUT',
            body: JSON.stringify(newCount)
        });

        updateProcessCountUI();
    } catch (error) {
        console.error('Error incrementing process count:', error);
    }
};

// Initialize counter on load
document.addEventListener('DOMContentLoaded', () => {
    updateProcessCountUI();
});
