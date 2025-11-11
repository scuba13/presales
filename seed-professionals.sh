#!/bin/bash

# Script para cadastrar profissionais de teste
# Uso: ./seed-professionals.sh

API_URL="http://localhost:3001/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxZDVjYTExLTAyY2YtNGQwMy05NWIxLTE4MzQzNDBjZWE1MyIsImVtYWlsIjoiYWRtaW5AcHJlc2FsZXMuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYyNjUxODA4LCJleHAiOjE3NjMyNTY2MDh9.rGJb8eVHlWBAknKH6uhVTc_Klbzk7iDXQ4LgCuU3e3s"

echo "🚀 Cadastrando profissionais de teste..."
echo ""

# Ler o arquivo JSON e cadastrar cada profissional
cat test-professionals.json | jq -c '.[]' | while read professional; do
  name=$(echo $professional | jq -r '.name')
  echo "📝 Cadastrando: $name"

  response=$(curl -s -X POST "$API_URL/professionals" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$professional")

  if echo $response | jq -e '.id' > /dev/null 2>&1; then
    echo "✅ $name cadastrado com sucesso!"
  else
    echo "❌ Erro ao cadastrar $name"
    echo "Response: $response"
  fi
  echo ""
done

echo "✨ Processo concluído!"
echo ""
echo "Acesse http://localhost:5173/professionals para ver os profissionais cadastrados"
