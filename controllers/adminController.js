const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// ----------------- PRODUTOS -----------------
exports.listar = (req, res) => {
  const sql = `
    SELECT p.id, p.nome, p.preco, p.descricao, c.nome AS categoria, p.imagem
    FROM produtos p
    JOIN categorias c ON p.categoria_id = c.id
    ORDER BY p.id DESC
  `;
  db.query(sql, (err, resultados) => {
    if (err) return res.send('Erro ao listar produtos.');
    res.render('admin/produtos/listar', { produtos: resultados, session: req.session });
  });
};

exports.novo = (req, res) => {
  db.query('SELECT * FROM categorias', (err, categorias) => {
    if (err) return res.send('Erro ao buscar categorias.');
    res.render('admin/produtos/novo', { produto: null, categorias, session: req.session });
  });
};

exports.inserir = (req, res) => {
  const { nome, descricao, preco, categoria_id } = req.body;
  const imagem = req.file ? req.file.filename : null;

  db.query(
    'INSERT INTO produtos (nome, descricao, preco, categoria_id, imagem) VALUES (?, ?, ?, ?, ?)',
    [nome, descricao, preco, categoria_id, imagem],
    (err) => {
      if (err) return res.send('Erro ao inserir produto.');
      res.redirect('/admin/produtos');
    }
  );
};

exports.editar = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM produtos WHERE id = ?', [id], (err, resultados) => {
    if (err || resultados.length === 0) return res.send('Produto não encontrado.');
    db.query('SELECT * FROM categorias', (err2, categorias) => {
      if (err2) return res.send('Erro ao buscar categorias.');
      res.render('admin/produtos/editar', { produto: resultados[0], categorias, session: req.session });
    });
  });
};

exports.atualizar = (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, categoria_id } = req.body;
  const imagem = req.file ? req.file.filename : null;

  let sql = 'UPDATE produtos SET nome=?, descricao=?, preco=?, categoria_id=?';
  const params = [nome, descricao, preco, categoria_id];

  if (imagem) {
    sql += ', imagem=?';
    params.push(imagem);
  }

  sql += ' WHERE id=?';
  params.push(id);

  db.query(sql, params, (err) => {
    if (err) return res.send('Erro ao atualizar produto.');
    res.redirect('/admin/produtos');
  });
};

exports.excluir = (req, res) => {
  const { id } = req.params;
  db.query('SELECT imagem FROM produtos WHERE id=?', [id], (err, resultados) => {
    if (err) return res.send('Erro ao buscar produto.');
    const imagem = resultados[0]?.imagem;
    if (imagem) {
      const caminho = path.join(__dirname, '../public/imagens', imagem);
      if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
    }
    db.query('DELETE FROM produtos WHERE id=?', [id], (err2) => {
      if (err2) return res.send('Erro ao excluir produto.');
      res.redirect('/admin/produtos');
    });
  });
};

// ----------------- CATEGORIAS -----------------
exports.listarCategorias = (req, res) => {
  db.query('SELECT * FROM categorias ORDER BY id DESC', (err, resultados) => {
    if (err) return res.send('Erro ao listar categorias.');
    res.render('admin/categorias/listar', { categorias: resultados, session: req.session });
  });
};

exports.novaCategoria = (req, res) => {
  res.render('admin/categorias/novo', { categoria: null, session: req.session });
};

exports.inserirCategoria = (req, res) => {
  const { nome } = req.body;
  db.query('INSERT INTO categorias (nome) VALUES (?)', [nome], (err) => {
    if (err) return res.send('Erro ao inserir categoria.');
    res.redirect('/admin/categorias');
  });
};

exports.editarCategoria = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM categorias WHERE id=?', [id], (err, resultados) => {
    if (err || resultados.length === 0) return res.send('Categoria não encontrada.');
    res.render('admin/categorias/editar', { categoria: resultados[0], session: req.session });
  });
};

exports.atualizarCategoria = (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  db.query('UPDATE categorias SET nome=? WHERE id=?', [nome, id], (err) => {
    if (err) return res.send('Erro ao atualizar categoria.');
    res.redirect('/admin/categorias');
  });
};

exports.excluirCategoria = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM categorias WHERE id=?', [id], (err) => {
    if (err) return res.send('Erro ao excluir categoria.');
    res.redirect('/admin/categorias');
  });
};
// ----------------- PEDIDOS -----------------
exports.listarPedidos = (req, res) => {
  const sql = `
    SELECT 
      p.id, 
      p.data_pedido AS data,
      p.total,
      u.nome AS cliente,
      sp.descricao AS status_pedido,
      sg.descricao AS status_pagamento,
      fp.descricao AS forma_pagamento
    FROM pedidos p
    JOIN usuarios u ON p.usuario_id = u.id
    JOIN status_pedido sp ON p.status_pedido_id = sp.id
    JOIN status_pagamento sg ON p.status_pagamento_id = sg.id
    JOIN forma_pagamento fp ON p.forma_pagamento_id = fp.id
    ORDER BY p.data_pedido DESC
  `;

  db.query(sql, (err, resultados) => {
    if (err) {
      console.error(err);
      return res.send('Erro ao buscar pedidos.');
    }

    // Garantir que total seja número
    const pedidos = resultados.map(pedido => ({
      ...pedido,
      total: parseFloat(pedido.total)
    }));

    res.render('admin/pedidos', { pedidos, session: req.session });
  });
};
exports.criarPedido = (req, res) => {
  const { usuario_id, itens } = req.body; // itens = [{ produto_id, quantidade, preco }, ...]

  // 1. Inserir pedido com total inicial 0
  db.query(
    'INSERT INTO pedidos (usuario_id, total) VALUES (?, 0)',
    [usuario_id],
    (err, resultadoPedido) => {
      if (err) return res.send('Erro ao criar pedido.');

      const pedido_id = resultadoPedido.insertId;

      // 2. Inserir itens do pedido
      const valoresItens = itens.map(item => [pedido_id, item.produto_id, item.quantidade, item.preco]);
      db.query(
        'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco) VALUES ?',
        [valoresItens],
        (err2) => {
          if (err2) return res.send('Erro ao adicionar itens do pedido.');

          // 3. Atualizar total do pedido
          const total = itens.reduce((acc, item) => acc + item.quantidade * item.preco, 0);
          db.query(
            'UPDATE pedidos SET total=? WHERE id=?',
            [total, pedido_id],
            (err3) => {
              if (err3) return res.send('Erro ao calcular total do pedido.');

              res.send('Pedido criado com sucesso!');
            }
          );
        }
      );
    }
  );
};


// ----------------- RELATÓRIOS -----------------
exports.gerarRelatorios = (req, res) => {
  res.send('Funcionalidade de relatórios ainda não implementada.');
};
