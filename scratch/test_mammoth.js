const mammoth = require('mammoth');
const fs = require('fs');

async function test() {
    try {
        // Create a dummy docx if possible? No, too hard.
        // But I can check if mammoth.convertToHtml exists and works with empty buffer.
        const result = await mammoth.convertToHtml({ arrayBuffer: Buffer.from([]) });
        console.log('Result:', result.value);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();
