const fs = require('fs');
let content = fs.readFileSync('C:/Users/Quan/Downloads/code/test_manager/routes/projects.js', 'utf8');

content = content.replace(
    "const auth = require('../middleware/auth'); // Require auth middleware for join/leave",
    "const { protect } = require('../middleware/auth');"
);
content = content.replace(
    "router.post('/:id/join', auth, async (req, res) => {",
    "router.post('/:id/join', protect, async (req, res) => {"
);
content = content.replace(
    "router.post('/:id/leave', auth, async (req, res) => {",
    "router.post('/:id/leave', protect, async (req, res) => {"
);

fs.writeFileSync('C:/Users/Quan/Downloads/code/test_manager/routes/projects.js', content, 'utf8');
