const db = require('../config/database');
const bcrypt = require('bcrypt'); // caso use senhas criptografadas no futuro

exports.listar = (req, res) => {
  db.query('SELECT id, nome, email, telefone, endereco FROM Cliente', (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao listar clientes', detail: err.message });
    res.json(results);
  });
};

exports.criar = async (req, res) => {
  try {
    const { nome, email, telefone, endereco, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });

    // opcional: verificar se email já existe
    db.query('SELECT id FROM Cliente WHERE email = ?', [email], async (err, rows) => {
      if (err) return res.status(500).json({ error: 'Erro no banco', detail: err.message });
      if (rows.length > 0) return res.status(409).json({ error: 'Email já cadastrado' });

      // se desejar armazenar senha criptografada:
      // const senhaHash = await bcrypt.hash(senha, 10);
      // usar senhaHash no insert. Por enquanto, mantenho senha como veio (considere migrar para hash).
      db.query(
        'INSERT INTO Cliente (nome, email, telefone, endereco, senha) VALUES (?, ?, ?, ?, ?)',
        [nome.trim(), email.trim(), telefone || '', endereco || '', senha],
        (err2, results) => {
          if (err2) return res.status(500).json({ error: 'Erro ao criar cliente', detail: err2.message });
          res.status(201).json({ id: results.insertId, nome: nome.trim(), email: email.trim() });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.buscarPorId = (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  db.query('SELECT id, nome, email, telefone, endereco FROM Cliente WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar cliente', detail: err.message });
    if (!result[0]) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(result[0]);
  });
};

exports.atualizar = (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, email, telefone, endereco } = req.body;
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  if (!nome || !email) return res.status(400).json({ error: 'Nome e email são obrigatórios' });

  db.query(
    'UPDATE Cliente SET nome=?, email=?, telefone=?, endereco=? WHERE id=?',
    [nome.trim(), email.trim(), telefone || '', endereco || '', id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Erro ao atualizar cliente', detail: err.message });
      res.json({ message: 'Cliente atualizado com sucesso' });
    }
  );
};

exports.deletar = (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  db.query('DELETE FROM Cliente WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Erro ao deletar cliente', detail: err.message });
    res.json({ message: 'Cliente deletado com sucesso' });
  });
};
