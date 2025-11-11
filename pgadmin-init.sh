#!/bin/bash

# Script para configurar servidor PostgreSQL no pgAdmin

# Criar arquivo de senha para o PostgreSQL
mkdir -p /tmp
cat > /tmp/pgpassfile << EOF
postgres:5432:presales:postgres:postgres123
postgres:5432:*:postgres:postgres123
EOF

chmod 600 /tmp/pgpassfile

echo "pgAdmin configurado com sucesso!"
echo "Acesse: http://localhost:5050"
echo "Email: admin@presales.com"
echo "Senha: admin123"
echo ""
echo "O servidor 'Presales PostgreSQL' já está configurado automaticamente!"
