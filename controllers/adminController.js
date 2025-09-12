const Produto = require('../models/produtoModel');
const Categoria = require('../models/categoriaModel');
const Pedido = require('../models/pedidoModel');
const Relatorio = require('../models/relatorioModel');
const Admin = require('../models/adminModel'); // se usar

// -------------------- DASHBOARD --------------------
exports.dashboard = async (req, res) => {
  try {
    const produtos = await Produto.listarTodos();
    const categorias = await Categoria.listarTodos();
    const pedidos = await Pedido.listarTodos();

    const totalProdutos = produtos.length;
    const totalCategorias = categorias.length;
    const totalPedidos = pedidos.length;

    res.render('admin/painel', {
      layout: 'admin/layoutAdmin',
      titulo: 'Dashboard',
      totalProdutos,
      totalCategorias,
      totalPedidos
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao carregar o dashboard');
  }
};

// -------------------- PRODUTOS --------------------
exports.listarProdutos = async (req, res) => {
  try {
    const produtos = await Produto.listarTodos();
    res.render('admin/produtos', { layout: 'admin/layoutAdmin', titulo: 'Produtos', produtos });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao listar produtos');
  }
};

exports.formProduto = async (req, res) => {
  try {
    const categorias = await Categoria.listarTodos();
    res.render('admin/formProduto', { layout: 'admin/layoutAdmin', titulo: 'Novo Produto', categorias });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao abrir formulário');
  }
};

exports.criarProduto = async (req, res) => {
  try {
    await Produto.inserir(req.body);
    res.redirect('/admin/produtos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao criar produto');
  }
};

exports.formEditarProduto = async (req, res) => {
  try {
    const produto = await Produto.buscarPorId(req.params.id);
    const categorias = await Categoria.listarTodos();
    res.render('admin/formProduto', { layout: 'admin/layoutAdmin', titulo: 'Editar Produto', produto, categorias });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao abrir edição');
  }
};

exports.editarProduto = async (req, res) => {
  try {
    await Produto.atualizar(req.params.id, req.body);
    res.redirect('/admin/produtos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao editar produto');
  }
};

exports.deletarProduto = async (req, res) => {
  try {
    await Produto.excluir(req.params.id);
    res.redirect('/admin/produtos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao deletar produto');
  }
};

// -------------------- CATEGORIAS --------------------
exports.listarCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.listarTodos();
    res.render('admin/categorias', { layout: 'admin/layoutAdmin', titulo: 'Categorias', categorias });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao listar categorias');
  }
};

exports.formCategoria = (req, res) => {
  res.render('admin/formCategoria', { layout: 'admin/layoutAdmin', titulo: 'Nova Categoria' });
};

exports.criarCategoria = async (req, res) => {
  try {
    await Categoria.inserir(req.body);
    res.redirect('/admin/categorias');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao criar categoria');
  }
};

exports.formEditarCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.buscarPorId(req.params.id);
    res.render('admin/formCategoria', { layout: 'admin/layoutAdmin', titulo: 'Editar Categoria', categoria });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao abrir edição de categoria');
  }
};

exports.editarCategoria = async (req, res) => {
  try {
    await Categoria.atualizar(req.params.id, req.body);
    res.redirect('/admin/categorias');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao editar categoria');
  }
};

exports.deletarCategoria = async (req, res) => {
  try {
    await Categoria.excluir(req.params.id);
    res.redirect('/admin/categorias');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao excluir categoria');
  }
};

// -------------------- PEDIDOS --------------------
exports.listarPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.listarTodos();
    res.render('admin/pedidos', { layout: 'admin/layoutAdmin', titulo: 'Pedidos', pedidos });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao listar pedidos');
  }
};

exports.verPedido = async (req, res) => {
  try {
    const pedido = await Pedido.buscarPorId(req.params.id);
    res.render('admin/verPedido', { layout: 'admin/layoutAdmin', titulo: `Pedido #${pedido.id}`, pedido });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao buscar pedido');
  }
};

// -------------------- RELATÓRIOS --------------------
exports.gerarRelatorios = async (req, res) => {
  try {
    let { inicio, fim } = req.query;
    if (!inicio || !fim) {
      const hoje = new Date();
      const trintaDias = new Date(hoje.getTime() - 29 * 24 * 60 * 60 * 1000);
      inicio = trintaDias.toISOString().slice(0, 10);
      fim = hoje.toISOString().slice(0, 10);
    }
    const relatorioProdutos = await Relatorio.vendasPorPeriodo(inicio, fim);
    res.render('admin/relatorios', { layout: 'admin/layoutAdmin', titulo: 'Relatórios', relatorioProdutos, inicio, fim });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao gerar relatórios');
  }
};
