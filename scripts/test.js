try {
    const fs = require('fs-extra');
    console.log('fs-extra loaded successfully');
} catch (e) {
    console.error('Failed to load fs-extra:', e);
}
