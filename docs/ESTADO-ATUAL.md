# FMII-Recomp — estado técnico da v0.2.0 em desenvolvimento

## Cenas aprovadas com HD desligado — 21/11/2026

- As 84 cenas de `CENAS.json` agora têm versões nativas quantizadas a partir dos recortes HD aprovados. `scripts/build-native-scenes.py --output <pasta de trabalho> --apply` reproduz a conversão com backup. Gere o manifesto depois.
- O Preview 2 limita a 64 os arquivos de substituição por mod. Os resultados estão agrupados em `mod/compatibility/scenes-mode-0.bin`, `scenes-mode-1.bin` e `scenes-mode-2.bin`, declarados em `source/manifest/data.json`. As lacunas entre cenas são preservadas do arquivo FMII de referência. Os 25 BINs individuais anteriores permanecem como fontes legadas, fora das substituições ativas.
- HD desligado usa as mesmas cenas aprovadas em resolução/paleta nativa; HD ligado continua usando os mesmos PNGs anteriores. Nenhum dos 600 recortes HD de cenas (incluindo a abertura) foi alterado. A abertura também foi convertida posteriormente: `mod/compatibility/campaign-opening-native.bin` reúne a logo FMII e o painel de hieróglifos, carregados separadamente pelo motor. Reproduza somente esse recurso com `scripts/build-native-scenes.py --opening-only --output <pasta> --apply`; sem esse argumento o gerador inclui as 84 cenas e a abertura.
- Foram conferidos 592 recortes por leitura independente de índices/paletas, sem divergências. Teste Windows carregou as 84 cenas com HD desligado; as nove panorâmicas foram conferidas também nas câmeras iniciais da referência. Teste adicional de seis cenas com HD ligado, incluindo camadas e flash da 208, com capturas compostas da janela.
- Registros da tarefa e backups: `D:/Codex/FMII-importacao/native-scenes-approved/`. Dados permanentes em `metadados/cenas-nativas/`. Não houve teste em aparelho Android nesta etapa; a mudança é de dados compartilhados pelos dois sistemas.

## Auditoria de tremida dos bustos — 21/11/2026

- Correção posterior em desenvolvimento: `source/bust-cache.c` carrega `mod/compatibility/campaign-busts-native.bin` com o banco original dos 65 registros quando HD está desligado. Compilados os três objetos PC/Android; teste Windows confirmou os bancos de Mahad 43/60 e Karim 2/48, nas três poses, idênticos à ISO.
- O ensaio de ajuste automático amplo das bocas HD deformou expressões e foi revertido após observação do usuário. Não reutilizar esse ensaio ou a piscada interpolada. Apenas as bocas de Mahad e Karim receberam ajuste localizado posterior (94 recortes em quatro registros); os demais arquivos HD devem coincidir com a cópia anterior. `scripts/stabilize-bust-mouths.py` agora está restrito a esses dois personagens. O script experimental `restore-hd-blink-transitions.py` não faz parte da correção aplicada.
- Instalada a correção restrita com backup em `D:/Codex/FMII-importacao/bust-motion-fix/backup-installed/`: 101 arquivos verificados por leitura de volta, lista/checksums em `installed.json` na pasta de trabalho. Repetido teste Windows HD das cinco poses de Mahad/Karim; demais texturas HD preservadas por comparação byte a byte. Guia regenerado e `--check` aprovado. Android compilado, sem teste em aparelho. As piscadas HD anteriores foram preservadas; a fidelidade integral de todos os quadros originais vale para o modo nativo.

- Conferência posterior direta da imagem `D:/Codex/Yu-Gi-Oh! Forbidden Memories (FM II Ghost Drop x15).BIN`: os 65 registros de bustos são idênticos byte a byte à extração usada na auditoria. Registro em `metadados/auditoria-bustos-movimento/iso-verificacao.json`. Isso confirma a referência das expressões para essa edição; não houve reparo aplicado ao pacote nesta conferência.

- Usuário informou tremida em Mahad e Karim com HD ligado e desligado. Auditoria em `metadados/auditoria-bustos-movimento/LEIA-ME.md`, reproduzível com `scripts/audit-bust-motion.py`.
- Comparadas 70 poses e as trilhas de 65 registros com a extração preservada `originais/dados-fmii/FMOD/FMODGTAV.1`; não foi encontrada a ISO bruta FMII para nova leitura. O modo sem HD também usa atlas refeito a partir das artes HD, portanto a descrição anterior de imagens nativas não significa pixels idênticos ao disco.
- Identificadas alterações além dos lábios nas camadas de fala, especialmente Mahad, e perda dos estados intermediários da piscada de Karim. BIN e 4.474 texturas de bustos coincidem com a instalação. Não foi aplicado reparo ao mod nem realizado teste interativo nesta auditoria; correções e validação em jogo pendentes.

Consulte [COMECE-AQUI.md](COMECE-AQUI.md) para retomar o projeto.

## Versionamento e changelog

- A cópia em `mod/` é a `0.2.0-dev`, em preparação para a futura release 0.2.0. `CHANGELOG.md` registra as alterações desta etapa e alimenta a seção Changelog do guia.
- A release publicada 0.1.0 foi restaurada com o ZIP, o checksum e o leia-me originais. Seu SHA-256 é `ea2f2baec72fdf7c0d387d8a56abe27a979a4aca95e05c2ff95834b09a2ea3df`. O pacote de desenvolvimento anterior à correção do versionamento está em `D:\Codex\FMII-importacao\desenvolvimento-0.2.0\pacote-antes-do-versionamento\`.

## Drops atuais: FMII e originais ausentes, por correspondência

- As cartas presentes no FMII seguem a planilha. A extensão cobre apenas as 518 originais ausentes no mapa FMII: 491 receberam 6.988 associações do disco original em 39 duelistas. O mapa completo, com 19 correspondências pelo mesmo nome/personagem e vinte definidas pelo usuário, fica em `metadados/drops-originais-correspondencias.json`.
- Correspondências adicionais aprovadas: Thief Bakura/Heishin, Thief King Bakura/Heishin 2nd, Guardian Dox/Labyrinth Mage, Yami Marik/Seto 2nd, Yami Marik 2nd/Seto 3rd, Diabound/DarkNite, Zorc Necrophades/Nitemare, Ryo Bakura/Yami Bakura, Joey Wheeler/Jono 2nd, Ishizu Ishtar/Isis, Priest Seto/Seto e Pharaoh Atem/Duel Master K. Kaiba/Seto Kaiba e Pegasus/Maximillion Pegasus continuam associados pelo personagem.
- São 117 tabelas, 11.006 associações e 1.239 cartas com drop (722 originais e 517 exclusivas FMII). Pesos normalizados para 2.048 por rank, todos positivos. As 200 associações sem referência Ghost permanecem fixadas em 1.
- As 27 cartas do FM original fora do catálogo FMII que ainda estavam sem drop foram atribuídas a Zorc Necrophades. O complemento Drop missing cards não foi incorporado. Pendências detalhadas em `metadados/drops-planilha/originais-pendentes.csv` e `importacao.json`.
- O importador reproduz as tabelas com backup e verifica a sincronização com a opção `--check`.

- Obelisk the Tormentor é recompensa de Seto Kaiba em S/A-Pow, com peso 1.

## Comparação histórica dos drops com o FM2 1.3.2

Os números desta seção registram o estado anterior à adoção da planilha.

- A imagem fornecida em `D:\Codex\data.iso`, identificada pelo usuário como 1.3.2, foi analisada em 21/11/2026. O boot aponta para `SLUS_027.11`. O SHA-256 da imagem é `811f28a5da17e66ddb4b23a8405c7d2e716cee950b005f4c24a2ce385831914d`.
- `metadados/drops-fmii-1.3.2/` contém a planilha por nome de carta, CSVs, relatório e JSON de auditoria. `scripts/compare-fmii-drops.py D:\Codex\data.iso` reproduz a comparação usando o resolvedor do guia para os drops efetivos do Recomp.
- Das 117 tabelas, 115 coincidem com a base Ghost oficial do projeto. Há sete diferenças de pesos no Simon S/A-Pow e 59 no Simon B/C/D. A ISO possui 652 cartas com peso positivo em algum grupo. O Recomp possui 1.147, incluindo essas 652 em algum duelista/rank. Há 34 associações específicas carta/duelista/rank exclusivas da ISO.
- As frações da ISO são anteriores aos filtros de entrega. Simon S/A-Pow soma 1.976 e cinco grupos B/C/D são vazios. O comportamento final desses casos e os filtros específicos da 1.3.2 precisam de validação em jogo. A versão 1.3.2 é a identificação informada pelo usuário, sem confirmação por string interna.
- Os arquivos de drops, fichas de duelistas, manifesto e bibliotecas do desenvolvimento conferiram com a instalação. O guia passou em `--check`. Esta tarefa produziu dados de comparação.

- **mod/** contém o pacote executável do mod. O HD é opcional, desativado por padrão nas configurações do mod. A instalação fica em D:\JOGOS RECOMPS\YU-GI-OH FORBIDDEN MEMORIES\yfm-redecomp-v0.3.1-preview.2\mods\FMII-Recomp.
- O catálogo tem 1.240 cartas. As 722 cartas do disco original continuam nos mesmos IDs. As 518 cartas adicionais do FMII usam arte e miniatura PNG em **mod/textures/cards/**. O Recomp gera os nomes. O mapa em **metadados/mapa-cartas-fmii.json** relaciona os 722 slots do FMII ao ID original ou à referência estável da carta adicional. As 25 variantes da auditoria de efeitos agora usam os IDs e as artes originais. Shadow Spell e Harpie's Feather Duster só recebem novo texto, pois os efeitos dos dois discos são equivalentes.
- **mod/decks/** e **mod/drops/** têm um JSON por oponente, com o mesmo nome da ficha em **mod/duelists/**. Os decks dos oponentes usam as tabelas do FMII. Os drops combinam a planilha FMII com os originais ausentes nos duelistas de mesmo nome, com 2.048 pontos por rank. O roteamento de Kaiba e Pegasus em `source/effects/fmii-drops.c` é compatível com a substituição completa das tabelas. A quantidade de cartas sorteadas por vitória é configurada no cliente.
- Auditoria dos 39 decks do FMII. As referências foram conferidas pelos nomes e os pesos de cada duelista somam 2.048. Kaiba usa o slot 15 do FMII e Pegasus o 17. Shine Palace aponta para Bright Castle, e 30,000-Year Whith Turtle aponta para 30,000-Year White Turtle. O hook de montagem do duelo faz Atem usar o próprio deck no slot 39, conforme o executável do FMII.
- A expansão usa as fusões e os 24 rituais originais diretamente do disco. Acrescenta 17.807 pares de fusão e dois rituais do FMII. 159 receitas compartilhadas já vêm do disco. Para 158 pares compartilhados com resultado diferente, vale a receita do original. A [lista dos 158 pares](metadados/fusoes-pares-divergentes-fmii.md) inclui os resultados dos dois jogos e exemplos verificados em duelo para o futuro guia do mod.
- Os 448 monstros da expansão usam Magician of Black Chaos (`copy: 722`) como base e herdam seu modelo 3D. O ID 722 não tem receitas de fusão como ingrediente nas tabelas atuais. `scripts/apply-fmii-effects.py` registra a compatibilidade dos equipamentos com os monstros da expansão para que a troca de base mantenha as combinações existentes.
- As magias e armadilhas da expansão usam Eternal Draught (`copy: 664`) e declaram seu `effect` separadamente. Os rituais da expansão usam Dark Magic Ritual (`copy: 721`), e Polymerization conserva o efeito associado ao slot 695. Essas duas bases não têm receitas de fusão como ingredientes nas tabelas atuais. Os equips usam a própria tabela de compatibilidade do mod. O guia verifica as fusões resultantes da herança e o pacote atual tem zero pares herdados.
- O início de uma campanha pode sortear o deck de 40 cartas do jogo base ou do FMII, com chances iguais para cada tabela. `source/manifest/starter_pools.json` contém os sete grupos e os pesos da entrada de nome do FMII. Há 70 cartas possíveis, incluindo 39 da expansão. `scripts/build-expansion-tables.py` recompõe as fusões e remapeia o deck inicial do FMII.
- A extração histórica das tabelas de drops da ISO, com os filtros de premiação identificados, está em metadados/drops-fmii/. O script scripts/export-fmii-drops.py reproduz essa referência. No FMII-Recomp atual, a premiação usa as associações atuais da planilha e dos originais por nome desde a primeira vitória, inclusive na última rodada do Desafio do Palácio.
- As molduras usam o campo frame da API, com a seleção de cartas lida do executável do FMII. Os patches do manifesto importam os trechos de textura e as paletas correspondentes da ISO. A opção Purple aponta para a paleta cinza de Horakhty.
- A moldura da edição de deck é lida no LBA 18.687. O pacote tem oito setores extras antes da paleta. A moldura de Five-Headed Dragon foi validada no visor da edição de deck após a correção.
- O Desafio do Palácio roda na cena 0x32 da campanha. Depois de cada vitória, o roteiro volta ao diálogo do palácio para preparar o próximo duelo. A extensão usa o requisito de entrada do FMII, o sorteio adaptado e os decks importados.
- **source/manifest/** contém as seções editáveis do manifesto. Depois de editar, execute `node scripts/build-mod-manifest.mjs` para gerar mod/mod.json.
- Os dados dos efeitos do FMII ficam em `source/manifest/`. O código dos efeitos e do roteamento de drops fica em `source/effects/`. O pacote `mod/` inclui a biblioteca `fmii-recomp`, que inicializa o código da campanha e dos efeitos. `scripts/apply-fmii-effects.py` extrai os bônus fixos e as 46 receitas de Polymerization dos arquivos de referência. Megamorph usa o bônus de +1.000 do Recomp.
- **mod/textures/** contém o manifesto do pacote de texturas e pastas separadas para retratos (portraits), bustos HD (busts-hd), cenas (scenes) e interface (interface).
- **mod/compatibility/** contém os BINs usados pelo jogo, com os BINs de cenas em compatibility/scenes/. **mod/duelists/** guarda as fichas dos duelistas, **mod/textures/bust-expressions/** os PNGs de expressão que elas referenciam e **mod/text/** os textos.
- Para recompilar a biblioteca, execute `scripts/build-mod-code.ps1 -Sdk <pasta-do-sdk-do-Recomp-Preview-2>`. O script coloca `fmii-recomp.o` e `fmii-recomp.x86_64-windows.o` em `mod/`.
- **scripts/** contém o empacotamento de cenas, o gerador da galeria e o renderizador da cena 208. Use node scripts/rebuild-hd.mjs 208 com Node.js e pngjs para recompor as texturas dessa cena na cópia de desenvolvimento. O flash e o corpo caído de Bakura têm opções independentes em scripts/scene208-settings.json.
- **scripts/originais/** reúne ferramentas históricas de extração, remontagem e auditoria. Confirme a versão e os caminhos antes de executar.
- **GALERIA-HD.html** mostra 84 cenas numeradas, a intro e a tela da logo da campanha. **CENAS.json** indica as artes, camadas e aprovações.
- **ELENCO.json** relaciona 39 slots do Free Duel a 34 personagens. Pastas de bustos usam o primeiro slot do personagem como prefixo.
- **originais/** reúne as cenas nativas do FMII, as camadas, a extração de FMODGTAV.1, o executável PS1 de referência e o texto original. As referências dos bustos e retratos também ficam em bustos-hd/referencias/ e portraits-hd/referencias/.

O roteiro ativo fica em mod/text/campaign.txt. A cópia de desenvolvimento usa os bustos nativos por padrão e carrega as substituições HD somente quando Texturas HD está ativado. Os BINs de compatibilidade fornecem dados de geometria e animação ao Recomp. Para validar HD, capture a janela composta pelo Recomp com MEMORIES_SDL_SCRIPT e MEMORIES_SCREENSHOT_DIR; a captura de VRAM do controle de testes não mostra as substituições HD. Converta as capturas BMP para RGB antes de redimensionar (o canal alfa da janela não é válido).

Os PNGs editáveis, as camadas e as prévias das cenas ficam em artes/. Os prompts e scripts de montagem ajudam a revisar e empacotar as artes. Para reproduzir os pixels exatos de uma geração por IA, preserve os PNGs atuais.

A cena 134 da versão 0.1.0 usa `artes/134-HD.png` e `artes/134-layer2-HD.png`. Execute `node scripts/rebuild-hd.mjs 134` para empacotar essas camadas nas texturas do mod. A galeria usa `artes/134-preview-HD.png`.

## Referências para manutenção visual

- Os retratos têm bancos distintos para campanha e Free Duel. As fontes e os recortes estão em `portraits-hd/`.
- A prévia em `caixa-dialogo-hd/PREVIA.png` recompõe as 11 peças da caixa de diálogo a partir das duas texturas HD e da geometria original.
- A arte HD dos bustos da campanha voltou à base da API.63 após a API.64 perder definição em jogo. As correções posteriores de expressões foram aplicadas sobre essa base.
- Há uma extração alternativa em `D:\Codex\FMII-importacao\bin-indicado`. Os arquivos têm hashes diferentes de `originais/dados-fmii/`. Use esta última pasta para reproduzir a importação oficial.

## Pendências e retomada

- A revisão do Marik preserva a franja da base HD na piscada e limita a sobreposição da fala aos lábios. A fala da derrota foi verificada na cena `0x6C`, diálogo `[0529]`, com os dois quadros de boca. O pacote ativo em `mod/` inclui os dois ajustes. A comparação em jogo e os quadros de fala editáveis estão em D:\Codex\FMII-importacao\marik-derrota.

- Textos de campanha são UTF-8. Ao editar com Python, sempre usar `encoding='utf-8'` na leitura e escrita. A leitura pelo padrão Windows corrompe os delimitadores « » das escolhas, introduzindo Â. As 255 opções foram corrigidas e sincronizadas com a instalação.

- Revisão de bustos de 13/11: 70 poses animadas / 32 personagens, com 2.127 recortes recompostos. Desert Mage e High Mage Martis não possuem diferenças nas expressões nativas. `scripts/register-bust-expressions.py` alinha as folhas existentes à base HD e ajusta a cor; `scripts/pack-registered-busts.py` empacota os recortes e atualiza o atlas de compatibilidade, preservando paletas e bancos de animação dos 65 registros. `scripts/audit-bust-expressions.py` recompõe base, piscada, duas bocas e fala com piscada. Não voltar a aplicar máscaras de diferenças pixel a pixel: deixam furos, resíduos da expressão anterior e manchas na pele.
- Os quadros completos registrados estão em D:\Codex\FMII-importacao\bust-review\smooth, e a auditoria composta está em final-audit. A revisão visual cobre 70 poses. O teste da janela HD cobriu 15 poses de Simon, Weevil, ambos os Bakuras e Marik. O script de registro usa OpenCV em D:\Codex\FMII-importacao\python-libs.
- Torre: o requisito de 400 vitórias contra Zorc é conferido antes de iniciar o duelo, inclusive se o texto já estava aberto. Cada oponente é anunciado no diálogo da campanha antes da luta. Foram exercitadas as 20 rodadas, a recusa com 399 vitórias e a saída por derrota. Não implementar filtros por biblioteca nem por vitórias para drops.
- Testar a cena 203 com a arte oficial v7, indicada em CENAS.json. Revisar a cena 104 quando o usuário pedir.
- Aplique as correções também à instalação da Preview 2 para o usuário testar em jogo. Com o jogo fechado, copie os arquivos alterados de mod/ para mods/FMII-Recomp e confira os arquivos instalados. Os arquivos originais, scripts e fontes ficam na pasta de desenvolvimento.
- O SDK fica na subpasta sdk da instalação do Recomp Preview 2. A compilação do C foi verificada numa cópia temporária do SDK, para i386 e x86_64-windows.
- Os dados extraídos foram guardados em originais/. Para novas extrações do disco inteiro, a imagem de referência continua em C:\Users\Stevan\Desktop\Yu-Gi-Oh! Forbidden Memories (FM II Ghost Drop x15)\Yu-Gi-Oh! Forbidden Memories (FM II Ghost Drop x15).BIN.

## Viabilidade do Android

- A análise em `metadados/android/VIABILIDADE.md` recomenda um único pacote PC/Android com objetos por plataforma e dados compartilhados. O objeto `fmii-recomp.aarch64-translated.o` agora foi compilado com o SDK Preview 2 e incluído em `mod/`. O código para PC também foi recompilado. A execução em Android ainda requer teste em aparelho/emulador.

- O seletor `hd` (Texturas HD) tem padrão 0 e requer reinício. As entradas de `mod/textures/manifest.json` usam esse seletor. As fichas dos duelistas usam os bustos e retratos nativos do FMII presentes nos BINs de compatibilidade, com HD opcional pelo texture pack. As artes PNG das cartas adicionais continuam disponíveis como dados essenciais das cartas.

- Teste de inicialização em Windows concluído com HD desligado e ligado (120 frames por configuração, 1.240 cartas e 39 duelistas). O objeto Android tem ABI correta e 48 imports disponíveis. Registros em `metadados/android/`. Teste de campanha/duelo e execução no Android permanecem pendentes. O ZIP criado em `D:/Codex/FMII-importacao/android/` é de desenvolvimento para teste, sem publicar release 0.2.0.

## Equipamentos nas cartas originais

- As 45 regras de equipamentos do FMII foram revisadas. 42 receberam 3.253 novos pares com os 461 monstros originais ausentes no mapa FMII. A extensão segue tipo, atributo, nível, ATK, ritual ou família; as regras existentes e Gearfried continuam preservados. Riryoku e Megamorph têm 1.068 alvos. Auditoria e critérios em `metadados/equips-originais/`.
- `scripts/extend-fmii-equips.py --apply` reproduz a extensão a partir do catálogo efetivo. Rode após reconstruir as tabelas de equips ou aplicar `scripts/apply-fmii-effects.py`, depois gere manifesto e guia. O guia inclui Equipamentos e listas nas fichas das cartas.

- Equips verificados no runtime da Preview 2: 48.105 combinações (45 equipamentos x 1.069 monstros), incluindo permissões e recusas, com zero divergências. Registro em `metadados/equips-originais/runtime-verificacao.json`. O guia passou nas consultas de Riryoku/Battle Ox e na exclusão de Gearfried.

## Passwords e custos do FMII

- As 722 cartas do FMII usam as colunas F/G da planilha Compilation - FM II, incluindo as 175 compartilhadas antes omitidas. A planilha prevalece em quatro preços divergentes da Ghost e deixa Egyptian God Slime sem password. São 714 compráveis por password e oito sem código. Os dados das cartas originais ausentes no FMII permanecem os do disco.
- `scripts/import-fmii-passwords.py --apply` reproduz os valores e `--check` confere a sincronização. O importador da expansão foi corrigido para incluir os compartilhados. Auditoria em `metadados/passwords-planilha/`.

- Passwords/loja verificados no runtime Windows Preview 2: 722 passwords e 722 preços sem divergências. Os dados do guia coincidem com todas as 722 linhas da importação. Registro em `metadados/passwords-planilha/runtime-verificacao.json`.

## Ordenação no guia

- Os cabeçalhos das listas paginadas são clicáveis e alternam ordem crescente/decrescente. O catálogo ordena ID, nome, origem, tipo, ATK, DEF, password e custo pelos valores reais, antes da paginação. Campos ausentes permanecem no fim em ambas as direções. Filtros, exportação e retorno da ficha preservam a ordenação. A mudança pertence ao guia e não foi adicionada ao changelog do mod.

- A nova distribuição de originais por nome foi conferida no runtime Windows Preview 2: 117 tabelas sem divergências nos pesos, totais e quantidades. Os duelistas sem correspondência autorizada mantêm suas tabelas anteriores. As associações da planilha FMII e os 200 pesos fixados em 1 foram preservados. Registro em `metadados/drops-planilha/runtime-verificacao.json`.

- A ampliação para as sete correspondências autorizadas foi validada no runtime Preview 2: 117 tabelas sem divergências. Somente esses sete duelistas mudaram; os outros 32, as associações FMII e os 200 pesos fixados em 1 foram preservados. Total de correspondências originais: 28, restando 11 duelistas sem autorização.

- Aprovados Ryo Bakura/Yami Bakura e Joey Wheeler/Jono 2nd para os drops das cartas originais ausentes no FMII. São 28 correspondências aplicadas e 11 duelistas pendentes. Backup anterior: `D:/Codex/FMII-importacao/planilha-drops/antes-20261121T132125365336Z`.

- A atualização de Ryo Bakura e Joey Wheeler foi validada nas 117 tabelas do runtime Preview 2, sem divergências. Apenas esses dois duelistas mudaram nesta etapa; os outros 37, as associações da planilha e os 200 pesos fixados em 1 foram preservados.

## Site do guia e GitHub Pages

- Identificada e corrigida a dependência de `guia/index.html` em imagens e documentos externos à pasta `guia/`. As fontes HTML, CSS e JavaScript foram preservadas e separadas em `scripts/guide-template.html`, `scripts/guide.css` e `scripts/guide.js`. O gerador exporta o site e seus recursos completos para `guia/`, mantendo os arquivos extras existentes.
- Backup anterior em `D:/Codex/FMII-importacao/guia-github/antes-20261121T161113Z/`. Nesta sessão não foi encontrado um checkout Git ou remoto do repositório FMII-guide na pasta local. A sincronização com o repositório depende de identificar seu endereço.


## Escopo do site confirmado em 21/11/2026

O usuário determinou publicar somente o guia no GitHub. A galeria HD e suas imagens de cenas não entram no site. Preserve a galeria local do projeto. Imagens de cartas, retratos dos duelistas e a interface permanecem no guia. GitHub conectado ao repositório the-patches/FMII-guide.
