const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\cutef\\.gemini\\antigravity\\brain\\94d8c12c-4844-457a-a89a-19b9d2ba6316\\.system_generated\\tasks\\task-6002.log', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes('PUT /api/user/profile 500')) {
        console.log(`--- MATCH AT LINE ${index + 1} ---`);
        for (let i = Math.max(0, index - 15); i < Math.min(lines.length, index + 15); i++) {
            console.log(`${i + 1}: ${lines[i]}`);
        }
    }
});
