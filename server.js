const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads') });
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';

// Helpers
function ensureDirSync(dirPath){
  if(!fs.existsSync(dirPath)){
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
function sanitizeFilename(name){
  return name.replace(/[^\w\-. ]+/g, '_');
}
function parseBool(v){
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return ['true','1','yes','on'].includes(v.toLowerCase());
  return false;
}

// Static files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Very simple auth middleware
function requireAdmin(req, res, next){
  const token = req.get('x-admin-token') || req.body.token || req.query.token;
  if(token && token === ADMIN_TOKEN) return next();
  res.status(401).json({ ok:false, error:'Unauthorized' });
}

// Admin portal
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Upload endpoint
app.post('/admin/upload', requireAdmin, upload.single('image'), async (req, res) => {
  try{
    const {
      title,
      year,
      date,
      medium,
      dimensions,
      price,
      available,
      category,
      description,
      featured
    } = req.body;

    if(!req.file) return res.status(400).json({ ok:false, error:'No image uploaded' });
    if(!title) return res.status(400).json({ ok:false, error:'Title is required' });

    const cat = (category === 'photography') ? 'photography' : 'artworks';
    const originalName = sanitizeFilename(req.file.originalname || `${Date.now()}.jpg`);
    const baseAssetsDir = path.join(__dirname, 'assets');
    const originalDir = path.join(baseAssetsDir, cat);
    const thumbsDir = path.join(baseAssetsDir, cat, 'thumbs');
    const optDir = path.join(baseAssetsDir, 'optimized', cat);
    const optThumbsDir = path.join(baseAssetsDir, 'optimized', cat, 'thumbs');

    [originalDir, thumbsDir, optDir, optThumbsDir].forEach(ensureDirSync);

    const originalTarget = path.join(originalDir, originalName);
    const optimizedTarget = path.join(optDir, originalName);
    const optimizedThumbTarget = path.join(optThumbsDir, originalName);

    // Move original file
    fs.renameSync(req.file.path, originalTarget);

    // Create optimized full image
    await sharp(originalTarget)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(optimizedTarget);

    // Create optimized thumbnail
    await sharp(originalTarget)
      .rotate()
      .resize({ width: 600, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toFile(optimizedThumbTarget);

    // (Optional) also create non-optimized thumbs for compatibility
    const nonOptThumbTarget = path.join(thumbsDir, originalName);
    if(!fs.existsSync(nonOptThumbTarget)){
      await sharp(originalTarget)
        .rotate()
        .resize({ width: 600, withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toFile(nonOptThumbTarget);
    }

    // Update data.json
    const dataFile = path.join(__dirname, 'data.json');
    let items = [];
    try{
      const raw = fs.readFileSync(dataFile, 'utf-8');
      items = JSON.parse(raw);
    }catch(_e){
      items = [];
    }

    const idPrefix = (cat === 'photography') ? 'ph' : 'mz';
    const newId = `${idPrefix}-${Date.now()}`;
    const relOriginal = `assets/${cat}/${originalName}`;
    const relOpt = `assets/optimized/${cat}/${originalName}`;
    const relOptThumb = `assets/optimized/${cat}/thumbs/${originalName}`;

    const newItem = {
      id: newId,
      title: title,
      year: year ? Number(year) : undefined,
      date: date || '',
      medium: medium || '',
      dimensions: dimensions || '',
      price: price ? Number(price) : undefined,
      available: parseBool(available),
      category: (cat === 'photography') ? 'photography' : 'painting',
      thumbnail: relOriginal,
      images: [relOriginal],
      description: description || '',
      featured: parseBool(featured),
      optimizedThumbnail: relOptThumb,
      optimizedImage: relOpt
    };

    items.unshift(newItem);
    fs.writeFileSync(dataFile, JSON.stringify(items, null, 2), 'utf-8');

    res.json({ ok:true, item:newItem });
  }catch(e){
    console.error(e);
    res.status(500).json({ ok:false, error:'Upload failed' });
  } finally {
    // Cleanup leftover temp file if it still exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch(_e){}
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (ADMIN_TOKEN === 'changeme') {
    console.log('WARNING: Using default admin token. Set ADMIN_TOKEN env var for security.');
  }
});


