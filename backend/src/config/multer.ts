import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, 'uploads/'); // Pasta onde os arquivos serão salvos
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Gerar nome único: timestamp-randomnumber-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

// Validação de tipos de arquivo
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Tipos permitidos
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'image/png',
    'image/jpeg',
    'image/jpg',
    'text/plain',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipo de arquivo não permitido: ${file.mimetype}. Formatos aceitos: PDF, DOCX, DOC, XLS, XLSX, PNG, JPG, TXT`
      )
    );
  }
};

// Configuração do multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo por arquivo
  },
});

// Helper para validar extensão
export const isValidFileExtension = (filename: string): boolean => {
  const allowedExtensions = ['.pdf', '.docx', '.doc', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.txt'];
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext);
};
