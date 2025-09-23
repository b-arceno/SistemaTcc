const db = require('../config/database');

exports.listar = (req, res) => {
  db.query('SELECT id, pedido_id, produto_id, quantidade, preco FROM ItemPedido', (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao listar itens', detail: err.message });
    res.json(results);
  });
};

exports.criar = (req, res) => {
  const { pedido_id, produto_id, quantidade, preco } = req.body;
  const pid = parseInt(pedido_id);
  const proid = parseInt(produto_id);
  const qtd = parseInt(quantidade);
  const pr = parseFloat(preco);

  if ([pid, proid, qtd].some(n => Number.isNaN(n)) || Number.isNaN(pr)) {
    return res.status(400).json({ error: 'Dados inválidos para item do pedido' });
  }

  db.query(
    'INSERT INTO ItemPedido (pedido_id, produto_id, quantidade, preco) VALUES (?, ?, ?, ?)',
    [pid, proid, qtd, pr],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Erro ao criar item', detail: err.message });
      res.status(201).json({ id: results.insertId, pedido_id: pid, produto_id: proid, quantidade: qtd });
    }
  );
};

exports.buscarPorId = (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  db.query('SELECT id, pedido_id, produto_id, quantidade, preco FROM ItemPedido WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar item', detail: err.message });
    if (!result[0]) return res.status(404).json({ error: 'Item não encontrado' });
    res.json(result[0]);
  });
};

exports.atualizar = (req, res) => {
  const id = parseInt(req.params.id);
  const { quantidade, preco } = req.body;
  const qtd = parseInt(quantidade);
  const pr = parseFloat(preco);
  if (Number.isNaN(id) || Number.isNaN(qtd) || Number.isNaN(pr)) return res.status(400).json({ error: 'Dados inválidos' });

  db.query('UPDATE ItemPedido SET quantidade=?, preco=? WHERE id=?', [qtd, pr, id], (err) => {
    if (err) return res.status(500).json({ error: 'Erro ao atualizar item', detail: err.message });
    res.json({ message: 'Item atualizado com sucesso' });
  });
};

exports.deletar = (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  db.query('DELETE FROM ItemPedido WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Erro ao deletar item', detail: err.message });
    res.json({ message: 'Item deletado com sucesso' });
  });
};
