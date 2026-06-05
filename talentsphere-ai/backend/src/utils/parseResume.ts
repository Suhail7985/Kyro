import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function parseResumeBuffer(
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase();
  if (mimetype === 'application/pdf' || ext.endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return data.text || '';
  }
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  throw new Error('Only PDF and DOCX resumes are supported');
}
