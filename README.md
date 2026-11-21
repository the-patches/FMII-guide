# FMII Guide

Este diretório contém o site estático do guia do FMII-Recomp, pronto para GitHub Pages e para abrir localmente.

## Arquivos do site

- `index.html`: guia e dados das cartas, drops, receitas e duelistas.
- `assets/guide.css`: estilos do guia.
- `assets/guide.js`: navegação, busca, filtros, ordenação e exportação CSV.
- `assets/cartas-originais/`: artes extraídas das cartas originais.
- `assets/mod/`: imagens utilizadas pelo guia, copiadas do mod.
- `assets/ui/`: logo e fundo do cabeçalho.
- `docs/`: cópias dos documentos que o site referencia.
- `assets-manifest.json`: inventário e checksums das imagens e fontes copiadas.
- `.nojekyll`: publica os arquivos estáticos diretamente no GitHub Pages.

Todos os caminhos do site são relativos a este diretório. O site não precisa da pasta do jogo, da ISO ou de um backend para funcionar. As rotas com `#` também funcionam em um endereço de projeto, como `https://usuario.github.io/FMII-guide/`.

## Publicação no repositório FMII-guide

1. Coloque o conteúdo deste diretório na raiz do repositório, incluindo `assets/`, `docs/` e `.nojekyll`.
2. No GitHub, abra Settings > Pages.
3. Em Build and deployment, selecione Deploy from a branch, a branch utilizada pelo repositório e a pasta /(root).
4. Salve. O GitHub mostrará o endereço quando a publicação terminar.

Não copie a pasta de desenvolvimento inteira nem os arquivos BIN do jogo para publicar o guia.

Publique somente o guia e suas imagens de cartas, retratos e interface. A galeria HD e suas imagens de cenas ficam fora do site.

## Fontes e manutenção no projeto FMII-Recomp

As fontes editáveis ficam em `scripts/guide-template.html`, `scripts/guide.css` e `scripts/guide.js`. O gerador é `scripts/build-guide.py`; os dados vêm do mod e das auditorias do projeto. Execute o gerador e depois `--check` para atualizar e conferir este diretório.

As cópias publicadas do CSS e do JavaScript são idênticas às fontes. Para manter as alterações em futuras gerações, faça as edições nas fontes do projeto e regenere o site.

O repositório do site também preserva uma cópia dessas fontes em `sources/`, incluindo o gerador. Para regenerar os dados do jogo, use o projeto de desenvolvimento completo.

O gerador copia os recursos necessários e não apaga arquivos extras, configurações de Git ou arquivos mantidos manualmente no diretório de publicação.
