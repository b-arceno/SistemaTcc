const db = require('../config/database');

exports.listar = (req, res) => {
  db.query('SELECT id, nome, descricao, preco, categoria_id, imagem FROM produtos WHERE ativo = 1', (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao listar produtos', detail: err.message });
    // garantir tipos
    const produtos = results.map(p => ({ ...p, preco: Number(p.preco) }));
    res.json(produtos);
  });
};

exports.criar = (req, res) => {
  const { nome, descricao, preco, categoria_id, imagem } = req.body;
  if (!nome || Number.isNaN(parseFloat(preco)) || Number.isNaN(parseInt(categoria_id))) {
    return res.status(400).json({ error: 'Dados inválidos. Nome, preco e categoria_id obrigatórios.' });
  }

  db.query(
    'INSERT INTO produtos (nome, descricao, preco, categoria_id, imagem) VALUES (?, ?, ?, ?, ?)',
    [nome.trim(), descricao || '', parseFloat(preco), parseInt(categoria_id, 10), imagem || null],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Erro ao criar produto', detail: err.message });
      res.status(201).json({ id: results.insertId, nome: nome.trim(), preco: parseFloat(preco) });
    }
  );
};

exports.buscarPorId = (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  db.query('SELECT id, nome, descricao, preco, categoria_id, imagem, ativo FROM produtos WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar produto', detail: err.message });
    if (!result[0] || result[0].ativo === 0) return res.status(404).json({ error: 'Produto não encontrado' });
    const produto = { ...result[0], preco: Number(result[0].preco) };
    res.json(produto);
  });
};

exports.atualizar = (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, descricao, preco, categoria_id, imagem } = req.body;
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  db.query(
    'UPDATE produtos SET nome=?, descricao=?, preco=?, categoria_id=?, imagem=? WHERE id=?',
    [nome, descricao || '', parseFloat(preco), parseInt(categoria_id, 10), imagem || null, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Erro ao atualizar produto', detail: err.message });
      res.json({ message: 'Produto atualizado com sucesso' });
    }
  );
};

exports.deletar = (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  // Em vez de deletar, desativa o produto
  db.query('UPDATE produtos SET ativo = 0 WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Erro ao desativar produto', detail: err.message });
    res.json({ message: 'Produto desativado com sucesso' });
  });
};
