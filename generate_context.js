const fs = require('fs');
const path = require('path');

const outputFile = 'tailorcv_full_context.txt';
const rootDir = process.cwd();

// Directories and files to explicitly include at the top level
const includePaths = [
  'apps',
  'packages',
  'docs',
  'README.md',
  'package.json',
  'tsconfig.json',
  'fly.toml',
  'Dockerfile',
];

// Patterns/Files to strictly exclude
const excludePatterns = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  'coverage',
  '.turbo',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  outputFile,
  'generate_context.js',
  '.DS_Store',
  '.env',
  '.env.local', // Don't upload secrets!
];

// Binary extensions to ignore
const binaryExtensions = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.pdf',
  '.exe',
  '.bin',
  '.webp',
  '.svg',
  '.eot',
  '.ttf',
  '.woff',
  '.woff2',
  '.mp4',
];

function isExcluded(filePath) {
  const relative = path.relative(rootDir, filePath);
  const parts = relative.split(path.sep);

  // Check if any directory part matches the exclude list
  for (const part of parts) {
    if (excludePatterns.includes(part)) return true;
  }

  // Check file extension
  if (binaryExtensions.includes(path.extname(filePath).toLowerCase()))
    return true;

  return false;
}

function processDirectory(currentPath, writeStream) {
  let items;
  try {
    items = fs.readdirSync(currentPath);
  } catch (e) {
    console.error(`Skipping directory ${currentPath}: ${e.message}`);
    return;
  }

  for (const item of items) {
    const fullPath = path.join(currentPath, item);

    if (isExcluded(fullPath)) continue;

    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (e) {
      continue;
    }

    if (stat.isDirectory()) {
      processDirectory(fullPath, writeStream);
    } else if (stat.isFile()) {
      const relativePath = path.relative(rootDir, fullPath);
      // writeStream.write(`\n\n--- FILE: ${relativePath} ---\n\n`);
      // XML-like tags are often better for LLMs to distinguish boundaries
      writeStream.write(
        `\n\n<file_content path="${relativePath.replace(/\\/g, '/')}">\n`,
      );
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        writeStream.write(content);
      } catch (err) {
        writeStream.write(`[Error reading file: ${err.message}]`);
      }
      writeStream.write(`\n</file_content>\n`);
    }
  }
}

console.log('Generating context file...');
const stream = fs.createWriteStream(outputFile, { flags: 'w' });
stream.write(
  `# TailorCV Project Context\nGenerated on ${new Date().toISOString()}\n\n`,
);

for (const inc of includePaths) {
  const fullPath = path.join(rootDir, inc);
  if (!fs.existsSync(fullPath)) continue;

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    processDirectory(fullPath, stream);
  } else {
    if (!isExcluded(fullPath)) {
      const relativePath = path.relative(rootDir, fullPath);
      console.log(`Adding: ${relativePath}`);
      stream.write(
        `\n\n<file_content path="${relativePath.replace(/\\/g, '/')}">\n`,
      );
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        stream.write(content);
      } catch (err) {
        stream.write(`[Error reading file: ${err.message}]`);
      }
      stream.write(`\n</file_content>\n`);
    }
  }
}

stream.end(() => {
  console.log(`\nSuccessfully generated ${outputFile}`);
});
