# Sistema TCC - Loja Online

Este é um sistema de loja online desenvolvido com Node.js, Express e MySQL. Permite gerenciamento de produtos, categorias, pedidos e usuários, com interfaces separadas para administradores e clientes.

## Funcionalidades

- Cadastro e login de usuários (clientes e admins)
- Gerenciamento de categorias e produtos (admin)
- Carrinho de compras e checkout (clientes)
- Pedidos e relatórios (admin)
- Upload de imagens para produtos

## Tecnologias Utilizadas

- **Node.js**: Ambiente de execução JavaScript no servidor
- **Express**: Framework web para Node.js
- **MySQL**: Banco de dados relacional
- **EJS**: Motor de templates para views
- **bcrypt**: Criptografia de senhas
- **Multer**: Upload de arquivos
- **Express-Session**: Gerenciamento de sessões

## Instalação

### 1. Pré-requisitos
- Node.js (versão 14+)
- MySQL Server
- Git

### 2. Clone o repositório
```bash
git clone <url-do-repo>
cd SistemaTcc
```

### 3. Instale as dependências
```bash
npm install
```

### 4. Configure o banco de dados
- Crie um banco chamado `confeitaria` no MySQL
- Execute o script `db.sql` para criar as tabelas
- Configure as variáveis no `.env` (copie de `.env.example` se existir)

### 5. Execute o projeto
```bash
npm start
# ou para desenvolvimento
npm run dev
```

O servidor rodará em http://localhost:3000

## Estrutura do Projeto

- `app.js`: Arquivo principal
- `config/`: Configurações (database, email)
- `controllers/`: Lógica de negócio (removidos os não utilizados)
- `models/`: Modelos de dados (removidos os não utilizados)
- `routes/`: Definição de rotas
- `views/`: Templates EJS
- `public/`: Assets estáticos (CSS, imagens)
- `utils/`: Utilitários (mailer)

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

Este projeto é licenciado sob a MIT License.
