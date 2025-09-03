const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const multer = require('multer');
const path = require('path');
const verificarAdmin = require('../middlewares/verificaAdmin'); // middleware admin

// ----------------- CONFIGURAÇÃO DE UPLOAD -----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/imagens/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ----------------- APLICAR MIDDLEWARE -----------------
router.use(verificarAdmin); // todas as rotas exigem admin

// ----------------- DASHBOARD -----------------
router.get('/', (req, res) => {
  res.render('admin/painel', { usuario: req.session.usuario });
});

// ----------------- PRODUTOS -----------------
router.get('/produtos', adminController.listar);
router.get('/produtos/novo', adminController.novo);
router.post('/produtos/novo', upload.single('imagem'), adminController.inserir);
router.get('/produtos/editar/:id', adminController.editar);
router.post('/produtos/editar/:id', upload.single('imagem'), adminController.atualizar);
router.get('/produtos/excluir/:id', adminController.excluir);

// ----------------- CATEGORIAS -----------------
router.get('/categorias', adminController.listarCategorias);
router.get('/categorias/novo', adminController.novaCategoria);
router.post('/categorias/novo', adminController.inserirCategoria);
router.get('/categorias/editar/:id', adminController.editarCategoria);
router.post('/categorias/editar/:id', adminController.atualizarCategoria);
router.get('/categorias/excluir/:id', adminController.excluirCategoria);

// ----------------- PEDIDOS -----------------
router.get('/pedidos', adminController.listarPedidos);

// ----------------- RELATÓRIOS -----------------
router.get('/relatorios', adminController.gerarRelatorios);

module.exports = router;
