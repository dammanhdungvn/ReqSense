const express = require('express');
const multer = require('multer');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter(req, file, cb) {
    const allowed = ['.pdf', '.md', '.txt', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`Unsupported format: ${ext}. Allowed: PDF, MD, DOC, DOCX`));
  },
});

router.post('/upload-document', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const { originalname, buffer } = req.file;
  const ext = path.extname(originalname).toLowerCase();

  try {
    let content = '';

    if (ext === '.pdf') {
      const data = await pdfParse(buffer);
      content = data.text;
    } else if (ext === '.md' || ext === '.txt') {
      content = buffer.toString('utf-8');
    } else if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
    }

    content = content.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    if (!content) {
      return res.status(422).json({ error: 'Could not extract text from this file. The file may be empty or image-only.' });
    }

    return res.json({
      filename: originalname,
      format: ext.slice(1).toUpperCase(),
      content,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      charCount: content.length,
    });
  } catch (err) {
    console.error('upload-document error:', err.message);
    return res.status(500).json({ error: `Parse failed: ${err.message}` });
  }
});

module.exports = router;
