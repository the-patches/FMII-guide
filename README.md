# FMII Guide

Este diret�rio cont�m o site est�tico do guia do FMII-Recomp, pronto para GitHub Pages e para abrir localmente.

## Arquivos do site

- `index.html`: guia e dados das cartas, drops, receitas e duelistas.
- `assets/guide.css`: estilos do guia.
- `assets/guide.js`: navega��o, busca, filtros, ordena��o e exporta��o CSV.
- `assets/cartas-originais/`: artes extra�das das cartas originais.
- `assets/mod/`: imagens utilizadas pelo guia, copiadas do mod.
- `assets/ui/`: logo e fundo do cabe�alho.
- `galeria.html` e `assets/galeria/`: galeria e suas imagens.
- `docs/`: c�pias dos documentos que o site referencia.
- `assets-manifest.json`: invent�rio e checksums das imagens e fontes copiadas.
- `.nojekyll`: publica os arquivos est�ticos diretamente no GitHub Pages.

Todos os caminhos do site s�o relativos a este diret�rio. O site n�o precisa da pasta do jogo, da ISO ou de um backend para funcionar. As rotas com `#` tamb�m funcionam em um endere�o de projeto, como `https://usuario.github.io/FMII-guide/`.

## Publica��o no reposit�rio FMII-guide

1. Coloque o conte�do deste diret�rio na raiz do reposit�rio, incluindo `assets/`, `docs/` e `.nojekyll`.
2. No GitHub, abra Settings > Pages.
3. Em Build and deployment, selecione Deploy from a branch, a branch utilizada pelo reposit�rio e a pasta /(root).
4. Salve. O GitHub mostrar� o endere�o quando a publica��o terminar.

N�o copie a pasta de desenvolvimento inteira nem os arquivos BIN do jogo para publicar o guia.

## Fontes e manuten��o no projeto FMII-Recomp

As fontes edit�veis ficam em `scripts/guide-template.html`, `scripts/guide.css` e `scripts/guide.js`. O gerador � `scripts/build-guide.py`; os dados v�m do mod e das auditorias do projeto. Execute o gerador e depois `--check` para atualizar e conferir este diret�rio.

As c�pias publicadas do CSS e do JavaScript s�o id�nticas �s fontes. Para manter as altera��es em futuras gera��es, fa�a as edi��es nas fontes do projeto e regenere o site.

O gerador copia os recursos necess�rios e n�o apaga arquivos extras, configura��es de Git ou arquivos mantidos manualmente no diret�rio de publica��o.