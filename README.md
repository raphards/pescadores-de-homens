# Pescadores de Homens

Jogo de totem para TV 32" na vertical (1080 × 1920), rodando no navegador.
Pedro, Tiago e João estão no barco; a cada partida um deles lança a tarrafa e o
jogador martela o botão para puxá-la, fisgando peixes nos 4 níveis do mar.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

Build de produção (pasta `dist/`, pode ser servida por qualquer servidor estático):

```bash
npm run build
npm run preview    # http://localhost:4173
```

No totem, use `totem.bat` (Windows): ele sobe o preview e abre o Chrome em kiosk.

## Controles

O "botão" aceita qualquer um destes, ao mesmo tempo:

| Entrada | Como |
|---|---|
| Teclado | qualquer tecla (Espaço/Enter servem), `F` alterna tela cheia |
| Botoeira arcade USB | aparece como gamepad — qualquer botão ou eixo |
| Tela touch / mouse | toque em qualquer lugar |

## Fluxo do jogo

1. **Standby** — rank na tela e o mar rodando no fundo. Toque no botão → começa.
2. **Nome** — teclado na tela (ou teclado físico). Se o nome já existe no rank,
   os pontos da partida **somam** ao total; se não existe, entra a partir de zero.
3. **Lançamento** — um dos pescadores arremessa a tarrafa, ela respinga e afunda até o fundo.
4. **Puxada (15 s)** — cada aperto levanta a rede; ela afunda sozinha (peso).
   A cada aperto a rede também **fisga**: martelar mais rápido = mais peixes.
   Apertos em sequência rápida sobem o **COMBO** e aceleram a fisgada.
5. **Zona de bênção** — a faixa dourada perto da superfície. Chegar nela antes do
   tempo acabar dá bônus fixo + bônus por segundo restante e os três comemoram.
6. **Falha** — se o tempo acabar antes, a tarrafa desce devagar e os pescadores
   ficam exaustivos. Os peixes fisgados continuam valendo.
7. **Resultado** — quebra de pontos, posição no rank e volta ao standby.

Peixes por nível (pontos padrão, ajustáveis):

| Nível | Peixe | Pontos |
|---|---|---|
| 1 (superfície) | Sardinha | 10 |
| 2 | Tainha | 25 |
| 3 | Dourado | 50 |
| 4 (fundo) | Pintado | 100 |

## Painel de ajustes (`/admin` ou `#/admin`)

Abra `http://localhost:5173/admin` (ou `#/admin`). Dá para ajustar
sem mexer no código:

- **Tempo** da puxada (segundos)
- **Dificuldade do clique**: força de cada aperto e peso da rede (quanto afunda)
- **Combo**: janela em ms, ganho por nível e teto
- **Tarrafa & bônus**: capacidade de peixes, bônus da zona, bônus por segundo restante
- **Pontos por nível** e **quantos apertos para fisgar 1 peixe** em cada nível
- **Zerar rank** e restaurar padrões

Os valores ficam salvos no `localStorage` do navegador e valem a partir da próxima
partida. Se salvar em outra aba, a próxima pescaria já usa os novos ajustes.

## Estrutura

```
src/
  main.ts            rota (#/admin ou jogo) + configuração do Phaser
  config.ts          layout 1080x1920, faixas, peixes, rede
  settings.ts        ajustes editáveis (localStorage) aplicados em SPECIES/BANDS
  admin.ts           painel de ajustes (DOM)
  rank.ts            rank persistido no localStorage
  input.ts           barramento único de "apertou o botão" (tecla/gamepad/toque)
  audio.ts           sons sintetizados (WebAudio, sem arquivos)
  ui.ts              fontes, cores, profundidades
  art/
    ocean.ts         céu, mar, ondas, barco (com a logo ONE'C) e pescadores
    fisherman.ts     Pedro, Tiago e João em vetor, com poses
    fish.ts          texturas dos peixes + peixes que nadam
    net.ts           tarrafa vetorial, corda e peixes presos
    effects.ts       respingos, confete, brilhos, textos flutuantes
    draw.ts          utilidades (curvas, arco de arremesso)
  scenes/
    BootScene.ts     gera as texturas
    InputScene.ts    lê gamepads
    AttractScene.ts  standby com rank
    NameScene.ts     entrada do nome
    GameScene.ts     a partida inteira
```

## Notas de balanceamento

- `pressGain` 0,017 e `sinkPerSec` 0,018: a rede precisa de ~50 apertos para
  alcançar a zona de bênção, e o peso obriga a martelar sem parar.
- Combo: apertos com menos de 200 ms de intervalo mantêm a sequência; o pico
  (8 níveis × 0,12) deixa a fisgada ~2× mais rápida.
- O bônus de rapidez (`40` por segundo restante) é o que faz valer a pena puxar
  rápido em vez de só encher a rede devagar.

## Dicas para o totem

- Resolução lógica fixa 1080×1920 com `Scale.FIT`: qualquer tela vertical
  funciona sem cortar nada (letterbox preto nas sobras).
- Chrome em kiosk: `chrome.exe --kiosk http://localhost:4173`
- Para trocar a arte vetorial por sprites, basta gerar texturas com as mesmas
  chaves em `art/fish.ts` / `art/ocean.ts`.
