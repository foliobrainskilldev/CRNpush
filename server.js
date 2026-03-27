const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Redireciona URLs com .html para a versão limpa
app.use((req, res, next) => {
    if (req.path.indexOf('.html') >= 0) {
        const cleanPath = req.path.replace(/\.html$/, '');
        const query = req.url.slice(req.path.length);
        return res.redirect(301, cleanPath + query);
    }
    next();
});

// Serve os arquivos estáticos (HTML, CSS, JS, etc.)
app.use(express.static(__dirname, {
    extensions: ['html'], 
    index: 'index.html'
}));

// Handler para erros 404 (Página Não Encontrada)
app.use((req, res) => {
    res.status(404);
    res.sendFile(path.join(__dirname, '404.html'), (err) => {
        if (err) {
            res.send(`
                <html lang="en">
                <head>
                    <title>404 - NexusCRM</title>
                    <style>
                        body { background: #f4f7fe; color: #2b3674; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        h1 { font-size: 4rem; margin-bottom: 10px; color: #4318ff; }
                        p { font-size: 1.2rem; color: #a3aed1; }
                        a { margin-top: 20px; padding: 10px 24px; background: #4318ff; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; transition: background 0.3s; }
                        a:hover { background: #3311db; }
                    </style>
                </head>
                <body>
                    <h1>404</h1>
                    <p>Página não encontrada.</p>
                    <a href="/">Voltar ao Painel</a>
                </body>
                </html>
            `);
        }
    });
});

// Inicia o servidor se não estiver em produção (O Vercel lida com isso sozinho na produção)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Servidor NexusCRM rodando na porta ${PORT}`);
    });
}

module.exports = app;