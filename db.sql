CREATE DATABASE confeitaria;
USE confeitaria;

-- TABELAS AUXILIARES

CREATE TABLE tipo_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(50) NOT NULL
);

CREATE TABLE status_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(50) NOT NULL
);

CREATE TABLE status_pagamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(50) NOT NULL
);

CREATE TABLE forma_pagamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(50) NOT NULL
);

CREATE TABLE categoria_produto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT
);

-- USUÁRIOS E CLIENTES

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario_id INT NOT NULL,
    telefone VARCHAR(20),
    endereco VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expira DATETIME,
    cep VARCHAR(20),
    rua VARCHAR(150),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(50),
    FOREIGN KEY (tipo_usuario_id) REFERENCES tipo_usuario(id)
);

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20)
);

-- PRODUTOS E CARRINHO

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    categoria_id INT,
    imagem VARCHAR(255),
    FOREIGN KEY (categoria_id) REFERENCES categoria_produto(id)
);

CREATE TABLE carrinho (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- PEDIDOS E ITENS

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    usuario_id INT,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pendente','em preparo','finalizado','a caminho','entregue','cancelado') DEFAULT 'pendente',
    total DECIMAL(10,2) NOT NULL,
    forma_pagamento_id INT,
    cep VARCHAR(20),
    rua VARCHAR(150),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(50),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (forma_pagamento_id) REFERENCES forma_pagamento(id)
);

CREATE TABLE itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT,
    produto_id INT,
    quantidade INT NOT NULL,
    preco_unit DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- TABELA DE SESSÕES (LOGIN)

CREATE TABLE sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT
);

-- DADOS INICIAIS

INSERT INTO tipo_usuario (descricao) VALUES 
('Administrador'),
('Cliente');

INSERT INTO forma_pagamento (descricao) VALUES 
('Cartão de Crédito'),
('Pix'),
('Boleto');

INSERT INTO status_pedido (descricao) VALUES 
('pendente'),
('em preparo'),
('finalizado'),
('a caminho'),
('entregue'),
('cancelado');

INSERT INTO status_pagamento (descricao) VALUES 
('pendente'),
('pago'),
('cancelado');
