const db = require('../config/database');

exports.listar = (req, res) => {
  db.query('SELECT id, nome FROM Categoria', (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao listar categorias', detail: err.message });
    res.json(results);
  });
};

exports.criar = (req, res) => {
  const { nome } = req.body;
  if (!nome || nome.trim() === '') return res.status(400).json({ error: 'Nome da categoria é obrigatório' });

  db.query('INSERT INTO Categoria (nome) VALUES (?)', [nome.trim()], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao criar categoria', detail: err.message });
    res.status(201).json({ id: results.insertId, nome: nome.trim() });
  });
};

exports.buscarPorId = (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  db.query('SELECT id, nome FROM Categoria WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar categoria', detail: err.message });
    if (!result[0]) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(result[0]);
  });
};

exports.atualizar = (req, res) => {
  const id = parseInt(req.params.id);
  const { nome } = req.body;
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  if (!nome || nome.trim() === '') return res.status(400).json({ error: 'Nome é obrigatório' });

  db.query('UPDATE Categoria SET nome = ? WHERE id = ?', [nome.trim(), id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erro ao atualizar categoria', detail: err.message });
    res.json({ message: 'Categoria atualizada com sucesso' });
  });
};

exports.deletar = (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  db.query('DELETE FROM Categoria WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Erro ao deletar categoria', detail: err.message });
    res.json({ message: 'Categoria deletada com sucesso' });
  });
};
