@echo off
echo ================================
echo  GHV - Configuracao do Banco
echo ================================
echo.

set /p DB_USER="Usuario do PostgreSQL (padrao: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres

set /p DB_NAME="Nome do banco (padrao: ghv_db): "
if "%DB_NAME%"=="" set DB_NAME=ghv_db

echo.
echo Criando banco de dados "%DB_NAME%"...
psql -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;"

echo.
echo Criando tabelas...
psql -U %DB_USER% -d %DB_NAME% -f schema.sql

echo.
echo Inserindo dados de exemplo...
psql -U %DB_USER% -d %DB_NAME% -f seed.sql

echo.
echo ================================
echo  Banco configurado com sucesso!
echo ================================
pause
