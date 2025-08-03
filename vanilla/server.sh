#!/bin/bash

# Script para levantar un servidor local para probar el sitio vanilla

echo "🚀 Iniciando servidor local para Greenborn Vanilla..."
echo "📁 Directorio: $(pwd)"
echo "🌐 URL: http://localhost:8000"
echo "⏹️  Para detener: Ctrl+C"
echo ""

# Verificar si Python está disponible
if command -v python3 &> /dev/null; then
    echo "🐍 Usando Python 3..."
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "🐍 Usando Python..."
    python -m http.server 8000
elif command -v node &> /dev/null && command -v npx &> /dev/null; then
    echo "📦 Usando Node.js serve..."
    npx serve . -p 8000
elif command -v php &> /dev/null; then
    echo "🐘 Usando PHP..."
    php -S localhost:8000
else
    echo "❌ No se encontró Python, Node.js o PHP"
    echo "   Instala uno de estos para usar el servidor local"
    echo "   O simplemente abre index.html en tu navegador"
    exit 1
fi
