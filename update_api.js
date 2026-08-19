const fs = require('fs');
let content = fs.readFileSync('C:/Users/Quan/Downloads/code/test_manager/public/js/api.js', 'utf8');

if (!content.includes('join:')) {
    content = content.replace(
        `update: (id, data) => fetchApi(\`/projects/\${id}\`, { method: 'PUT', body: JSON.stringify(data) }),`,
        `update: (id, data) => fetchApi(\`/projects/\${id}\`, { method: 'PUT', body: JSON.stringify(data) }),\n    join: (id) => fetchApi(\`/projects/\${id}/join\`, { method: 'POST' }),\n    leave: (id) => fetchApi(\`/projects/\${id}/leave\`, { method: 'POST' }),`
    );
    fs.writeFileSync('C:/Users/Quan/Downloads/code/test_manager/public/js/api.js', content, 'utf8');
}
