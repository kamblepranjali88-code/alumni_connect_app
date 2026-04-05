const fs = require('fs');
const path = require('path');

// ✅ UPDATE THIS PATH to where your HTML files are
const HTML_FOLDER = './html';

// Step 1: Create logout.js in the html folder
const logoutJS = `function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}
`;

fs.writeFileSync(path.join(HTML_FOLDER, 'logout.js'), logoutJS);
console.log('✅ Created logout.js');

// Step 2: Update all HTML files
const files = fs.readdirSync(HTML_FOLDER).filter(f => f.endsWith('.html'));

let updatedFiles = 0;
let skippedFiles = 0;

files.forEach(file => {
    const filePath = path.join(HTML_FOLDER, file);
    let content = fs.readFileSync(filePath, 'utf8');

    let changed = false;

    // Fix 1: Replace logout link
    if (content.includes('href="login.html" class="logout"')) {
        content = content.replace(
            /href="login\.html" class="logout"/g,
            'href="#" class="logout" onclick="logout()"'
        );
        changed = true;
    }

    // Fix 2: Add logout.js script before </body> if not already added
    if (!content.includes('logout.js')) {
        content = content.replace(
            '</body>',
            '    <script src="logout.js"></script>\n</body>'
        );
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${file}`);
        updatedFiles++;
    } else {
        console.log(`⏭️  Skipped (no changes needed): ${file}`);
        skippedFiles++;
    }
});

console.log('\n=============================');
console.log(`✅ Done! Updated: ${updatedFiles} files`);
console.log(`⏭️  Skipped: ${skippedFiles} files`);
console.log('=============================');