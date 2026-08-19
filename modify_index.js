const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Replace admin-only classes
html = html.replace(
  /<span class="sidebar__section-label admin-only" id="adminSectionLabel" style="display:none">Hệ thống<\/span>/,
  '<span class="sidebar__section-label" id="adminSectionLabel">Hồ sơ & Tài khoản</span>'
);
html = html.replace(
  /<a class="nav-item admin-only" data-section="accounts" id="nav-accounts" style="display:none">/,
  '<a class="nav-item" data-section="accounts" id="nav-accounts">'
);

// Replace section-accounts content
const sectionStart = html.indexOf('<section id="section-accounts"');
const sectionEnd = html.indexOf('</section>', sectionStart) + 10;

const newSection = `
      <section id="section-accounts" class="section">
        <div id="accounts-admin-view" style="display:none"></div>
        <div id="accounts-user-view" style="display:none"></div>
      </section>
`;

html = html.substring(0, sectionStart) + newSection.trim() + html.substring(sectionEnd);
fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Modified index.html');
