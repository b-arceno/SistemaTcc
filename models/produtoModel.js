const db = require('../config/database');

// Lista todos os produtos
exports.listarTodos = (callback) => {
  const sql = `
    SELECT p.*, c.nome AS categoria_nome
    FROM produtos p
    JOIN categoria_produto c ON p.categoria_id = c.id
    ORDER BY p.id DESC
  `;
  db.query(sql, callback);
};

// Inserir novo produto
exports.inserir = (produto, callback) => {
  const sql = `
    INSERT INTO produtos (nome, descricao, preco, categoria_id, imagem)
    VALUES (?, ?, ?, ?, ?)
  `;
  const valores = [
    produto.nome,
    produto.descricao,
    produto.preco,
    produto.categoria_id,
    produto.imagem
  ];
  db.query(sql, valores, callback);
};

// Buscar produto por ID
exports.buscarPorId = (id, callback) => {
  const sql = `
    SELECT p.*, c.nome AS categoria_nome
    FROM produtos p
    JOIN categoria_produto c ON p.categoria_id = c.id
    WHERE p.id = ?
  `;
  db.query(sql, [id], callback);
};

// Atualizar produto
exports.atualizar = (id, produto, callback) => {
  const sql = `
    UPDATE produtos
    SET nome = ?, descricao = ?, preco = ?, categoria_id = ?, imagem = ?
    WHERE id = ?
  `;
  const valores = [
    produto.nome,
    produto.descricao,
    produto.preco,
    produto.categoria_id,
    produto.imagem || null, // se não mandar imagem, pode salvar null
    id
  ];
  db.query(sql, valores, callback);
};

// Excluir produto
exports.excluir = (id, callback) => {
  const sql = `DELETE FROM produtos WHERE id = ?`;
  db.query(sql, [id], callback);
};
