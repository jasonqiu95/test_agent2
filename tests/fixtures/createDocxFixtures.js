/**
 * Script to create DOCX fixtures for integration testing
 * Creates various test scenarios for DOCX import functionality
 */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

/**
 * Create a DOCX file with formatted content (bold, italic, headings)
 */
async function createFormattedDocx() {
  const zip = new JSZip();

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Chapter 1: Formatted Text</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>This text is bold.</w:t>
      </w:r>
      <w:r>
        <w:t> </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:i/>
        </w:rPr>
        <w:t>This text is italic.</w:t>
      </w:r>
      <w:r>
        <w:t> </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:i/>
        </w:rPr>
        <w:t>This text is bold and italic.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>This paragraph contains </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:u w:val="single"/>
        </w:rPr>
        <w:t>underlined text</w:t>
      </w:r>
      <w:r>
        <w:t> and </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:strike/>
        </w:rPr>
        <w:t>strikethrough text</w:t>
      </w:r>
      <w:r>
        <w:t>.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>Section 1.1: Subsection</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>This is regular text in a subsection.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Chapter 2: More Content</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Another chapter with plain text.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  addCommonFiles(zip, documentXml);
  await saveZip(zip, 'sample-formatted.docx');
}

/**
 * Create a DOCX file with front matter, chapters, and back matter
 */
async function createFrontBackMatterDocx() {
  const zip = new JSZip();

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Preface</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>This is the preface of the book. It introduces the main themes and provides context for what follows. The preface is typically part of the front matter.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Prologue</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>The story begins long before the main events. This prologue sets the stage for the adventure to come.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Chapter 1: The Start</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>This is the first chapter of the main story. The narrative begins here with our protagonist's introduction.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Chapter 2: The Middle</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>The second chapter continues the story with rising action and character development.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Chapter 3: The End</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>The final chapter brings resolution to the main story arc.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Epilogue</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Years later, we check in with our characters and see where life has taken them. This epilogue provides closure and hints at future possibilities.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Afterword</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>The author reflects on the writing process and the themes explored in this work. This afterword is part of the back matter.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  addCommonFiles(zip, documentXml);
  await saveZip(zip, 'sample-front-back-matter.docx');
}

/**
 * Create a large DOCX file (10MB+)
 */
async function createLargeDocx() {
  const zip = new JSZip();

  // Generate lots of content to reach 10MB+
  let chapters = '';
  const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ';

  for (let i = 1; i <= 50; i++) {
    chapters += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Chapter ${i}: Long Chapter ${i}</w:t>
      </w:r>
    </w:p>`;

    // Add 100 paragraphs per chapter
    for (let j = 0; j < 100; j++) {
      chapters += `
    <w:p>
      <w:r>
        <w:t>${loremIpsum.repeat(5)}</w:t>
      </w:r>
    </w:p>`;
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${chapters}
  </w:body>
</w:document>`;

  addCommonFiles(zip, documentXml);
  await saveZip(zip, 'sample-large.docx');
}

/**
 * Create a corrupted DOCX file
 */
async function createCorruptedDocx() {
  const zip = new JSZip();

  // Invalid XML with missing closing tags and malformed structure
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>This is corrupted
      </w:r>
    </w:p>
  <!-- Missing closing tags -->`;

  addCommonFiles(zip, documentXml);
  await saveZip(zip, 'sample-corrupted.docx');
}

/**
 * Create an empty DOCX file
 */
async function createEmptyDocx() {
  const zip = new JSZip();

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:r>
        <w:t></w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  addCommonFiles(zip, documentXml);
  await saveZip(zip, 'sample-empty.docx');
}

/**
 * Add common DOCX structure files
 */
function addCommonFiles(zip, documentXml) {
  zip.file('word/document.xml', documentXml);

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:pPr>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:pPr>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
  </w:style>
</w:styles>`;

  zip.file('word/styles.xml', stylesXml);

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
}

/**
 * Save zip to file
 */
async function saveZip(zip, filename) {
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const outputPath = path.join(__dirname, filename);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Created: ${filename}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('Creating DOCX fixtures for integration tests...');

  await createFormattedDocx();
  await createFrontBackMatterDocx();
  await createLargeDocx();
  await createCorruptedDocx();
  await createEmptyDocx();

  console.log('All fixtures created successfully!');
}

main().catch(console.error);
