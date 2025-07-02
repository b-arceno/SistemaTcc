const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

const multer = require('multer');
const path = require('path');

// Configuração do multer para upload de imagem
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/imagens/');
  },
  filename: function (req, file, cb) {
    const nomeArquivo = Date.now() + path.extname(file.originalname);
    cb(null, nomeArquivo);
  }
});

const upload = multer({ storage });

// ROTAS DE PRODUTO
router.get('/', produtoController.listar);
router.get('/novo', produtoController.novo);
router.post('/novo', upload.single('imagem'), produtoController.inserir);
router.get('/editar/:id', produtoController.editar);
router.post('/editar/:id', produtoController.atualizar);
router.get('/excluir/:id', produtoController.excluir);

module.exports = router;
