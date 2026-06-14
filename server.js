import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for file uploads (storing in memory to just get the hash)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MongoDB Connection & In-memory Fallback
let isMongoConnected = false;
let fallbackDB = []; // In-memory database

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/belge-dogrulama', {
}).then(() => {
    isMongoConnected = true;
    console.log("MongoDB'ye başarıyla bağlanıldı.");
}).catch(err => {
    console.error("MongoDB bağlantı hatası, RAM üzerinde geçici bellek kullanılacak.");
});

// Document Schema
const documentSchema = new mongoose.Schema({
    hash: { type: String, required: true, unique: true },
    filename: String,
    ownerAddress: String,
    txHash: String, // Blockchain'deki transaction hash'i
    timestamp: { type: Date, default: Date.now }
});
const DocumentModel = mongoose.model('Document', documentSchema);

// API Endpoint: Belge Hash'ini Çıkarma
app.post('/api/hash', upload.single('document'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Lütfen bir belge yükleyin.' });
    }

    // Belgenin SHA-256 Hash'ini hesapla
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    
    res.json({
        hash: `0x${hash}`, // Ethereum formatı için 0x ekleniyor
        filename: req.file.originalname
    });
});

// API Endpoint: Belgeyi Veritabanına Kaydetme (Blockchain'e yazıldıktan sonra çağrılır)
app.post('/api/documents', async (req, res) => {
    const { hash, filename, ownerAddress, txHash } = req.body;

    if (isMongoConnected) {
        try {
            const newDoc = new DocumentModel({ hash, filename, ownerAddress, txHash });
            await newDoc.save();
            res.status(201).json({ message: 'Belge başarıyla kaydedildi.', doc: newDoc });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ error: 'Bu belge zaten veritabanında kayıtlı.' });
            }
            res.status(500).json({ error: 'Sunucu hatası', details: error.message });
        }
    } else {
        // Fallback RAM DB
        if (fallbackDB.find(d => d.hash === hash)) {
            return res.status(400).json({ error: 'Bu belge zaten kaydedilmiş.' });
        }
        const newDoc = { hash, filename, ownerAddress, txHash, timestamp: new Date() };
        fallbackDB.push(newDoc);
        res.status(201).json({ message: 'Belge başarıyla RAM DB ye kaydedildi.', doc: newDoc });
    }
});

// API Endpoint: Veritabanında Belge Sorgulama
app.get('/api/documents/:hash', async (req, res) => {
    if (isMongoConnected) {
        try {
            const doc = await DocumentModel.findOne({ hash: req.params.hash });
            if (doc) {
                res.json(doc);
            } else {
                res.status(404).json({ error: 'Belge veritabanında bulunamadı.' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    } else {
        const doc = fallbackDB.find(d => d.hash === req.params.hash);
        if (doc) {
            res.json(doc);
        } else {
            res.status(404).json({ error: 'Belge bulunamadı.' });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
    console.log(`Arayüz: http://localhost:${PORT}`);
});
