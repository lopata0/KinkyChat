import { createRequire } from "module";
const require = createRequire(import.meta.url);

const fs = require('fs');
const archiver = require('archiver');

const out = "./dist/KinkyChat.zip";

if (fs.existsSync(out)) fs.unlinkSync(out);

const output = fs.createWriteStream(out);
const archive = archiver('zip', { zlib: { level: 9 } });

archive.pipe(output);
archive.file('./dist/KinkyChat.ks', { name: 'KinkyChat.ks' });
archive.file('./mod.json', { name: 'mod.json' });
archive.finalize();