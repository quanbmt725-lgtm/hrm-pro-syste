const fs = require('fs');
let content = fs.readFileSync('C:/Users/Quan/Downloads/code/test_manager/routes/tasks.js', 'utf8');

const getPendingStr = `// GET /api/tasks/pending-approval
router.get('/pending-approval', async (req, res) => {
  try {
    const tasks = await Task.find({ approvalStatus: 'pending' })
      .populate('project', 'name')
      .populate('assignee', 'fullName')
      .sort('-updatedAt');
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});`;

// Replace if it exists, or just move it if it's there
let pendingIndex = content.indexOf(`router.get('/pending-approval'`);
if (pendingIndex === -1) {
    pendingIndex = content.indexOf(`router.get("/pending-approval"`);
}

if (pendingIndex !== -1) {
    // Extract the pending route
    let pendingEnd = content.indexOf('});', pendingIndex) + 3;
    let pendingBlock = content.substring(pendingIndex, pendingEnd);
    
    // Remove it from original place (also remove previous comment if any)
    let removeStart = content.lastIndexOf('//', pendingIndex);
    if(removeStart === -1 || removeStart < pendingIndex - 50) removeStart = pendingIndex;
    content = content.substring(0, removeStart) + content.substring(pendingEnd);
    
    // Insert before router.get('/:id')
    let idIndex = content.indexOf(`router.get('/:id'`);
    if(idIndex !== -1) {
        content = content.substring(0, idIndex) + pendingBlock + '\n\n' + content.substring(idIndex);
    }
}

fs.writeFileSync('C:/Users/Quan/Downloads/code/test_manager/routes/tasks.js', content, 'utf8');
