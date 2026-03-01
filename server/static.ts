import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Em produção, os arquivos estarão em dist/public
  // Em desenvolvimento, usar caminho relativo
  const distPath = process.env.NODE_ENV === "production" 
    ? path.resolve(process.cwd(), "dist/public")
    : path.resolve(process.cwd(), "dist/public");
    
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Middleware para servir index.html para rotas SPA
  app.use((req, res, next) => {
    // Se for uma requisição para API, deixar passar
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    
    // Se o arquivo existir, servir estático
    if (fs.existsSync(path.join(distPath, req.path))) {
      return next();
    }
    
    // Senão, servir index.html
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
