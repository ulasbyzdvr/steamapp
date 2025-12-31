@echo off
echo 🚀 Steam Free Games - Frontend Starting...
echo.
cd /d "%~dp0"
npx --yes -p vite@5.0.8 -p @vitejs/plugin-react@4.2.0 -p tailwindcss@3.3.6 -p autoprefixer@10.4.16 -p postcss@8.4.32 vite
