const multer = require('multer'); // Importa il modulo Multer per gestire l'upload dei file

// file upload middleware
const storage = multer.diskStorage({
    // Specifica la cartella di destinazione dove salvare i file
    destination: './public/img/products/',
    // Definisce il nome del file salvato
    filename: (req, file, cb) => {
        // Crea un nome univoco combinando timestamp e nome originale del file
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);// Passa il nome del file alla callback
    },
});

// Inizializza Multer con la configurazione dello storage
const upload = multer({ storage });
// Esporta il middleware per poterlo utilizzare nelle rotte
module.exports = upload;