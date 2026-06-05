const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function parseResumeBuffer(buffer, mimetype, originalname) {
  const ext = (originalname || '').toLowerCase();
  const isPdf = mimetype === 'application/pdf' || ext.endsWith('.pdf');
  const isDocx =
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext.endsWith('.docx');

  if (isPdf) {
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  if (isDocx) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  throw new Error('Unsupported file type. Upload PDF or DOCX only.');
}

module.exports = { parseResumeBuffer };
