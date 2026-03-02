/**
 * Script to create a sample DOCX file for E2E testing
 * Creates a realistic document with multiple chapters using JSZip
 */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function createSampleDocx() {
  const zip = new JSZip();

  // Create document.xml with multiple chapters and realistic content
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Title"/>
      </w:pPr>
      <w:r>
        <w:t>The Adventures of Test Book</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Subtitle"/>
      </w:pPr>
      <w:r>
        <w:t>By E2E Tester</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Chapter 1: The Beginning</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>It was a bright cold day in April, and the clocks were striking thirteen. This is the first paragraph of the first chapter. It contains some sample text to demonstrate the import functionality of the book publishing application.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>The second paragraph continues the story. This paragraph demonstrates that the import process can handle multiple paragraphs within a single chapter.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Chapter 2: The Journey</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>The journey began at dawn. Our hero set out with determination and hope, ready to face whatever challenges lay ahead. This chapter explores the early stages of the adventure.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>As the sun rose higher in the sky, the path became more challenging. Yet our protagonist pressed on, driven by an inner strength that could not be diminished.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Chapter 3: The Discovery</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>In the depths of the ancient forest, a remarkable discovery awaited. Hidden beneath layers of moss and time, lay the key to everything that had been sought.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>The discovery changed everything. What had seemed impossible now appeared within reach. This was the turning point in the tale.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>Chapter 4: The Return</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>With newfound wisdom and experience, the return journey began. Every step homeward was filled with reflection on all that had transpired.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Home appeared on the horizon just as the sun began to set. The adventure had come full circle, and a new chapter of life was about to begin.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  // Create styles.xml with proper heading styles
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:pPr>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
  </w:style>
</w:styles>`;

  // Add files to the zip
  zip.file('word/document.xml', documentXml);
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

  // Generate the zip file
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const outputPath = path.join(__dirname, 'sample-book.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Sample DOCX created at: ${outputPath}`);
}

createSampleDocx().catch(console.error);
