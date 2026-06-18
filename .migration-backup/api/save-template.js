import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, content } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: 'Missing filename or content' });
    }

    // Security check - only allow specific template files
    const allowedFiles = [
      'kwality-house-november-template.html',
      'supreme-hq-november-template.html'
    ];
    
    if (!allowedFiles.includes(filename)) {
      return res.status(403).json({ error: 'Unauthorized file access' });
    }

    // Save to both root directory and public directory
    const rootPath = path.join(process.cwd(), filename);
    const publicPath = path.join(process.cwd(), 'public', filename);

    await fs.writeFile(rootPath, content, 'utf8');
    await fs.writeFile(publicPath, content, 'utf8');

    res.status(200).json({ 
      message: 'Template saved successfully',
      filename,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ error: 'Failed to save template' });
  }
}