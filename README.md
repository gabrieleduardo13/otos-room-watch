# OTOS Office Monitor

Projeto: Consultórios OTOS

Desenvolva uma aplicação web responsiva para gerenciamento e acompanhamento dos equipamentos de informática dos consultórios de uma clínica chamada OTOS.

O sistema deve possuir três andares: Térreo, 1º Andar e 2º Andar.

Cada andar deve possuir seus respectivos consultórios. Ao clicar em um consultório, abrir uma página detalhada contendo:

 Número do consultório

 Médicos que utilizam o consultório, permitindo cadastrar até 2 médicos

 CPU/Computador

 Monitor

 Estabilizador

 Teclado/Mouse

 Conexão

 Sistemas

 Situação atual

 Observações

Cada equipamento deve possuir uma situação: "OK", "Atenção" ou "Problema".

O sistema também deve possuir um histórico de alterações por consultório.

Sempre que houver uma alteração, deve ser possível registrar:

 Data

 Equipamento afetado

 Tipo de alteração

 Descrição

 Responsável pela alteração

Exemplos:

"03/09/2026 — Monitor — Troca de equipamento — Monitor substituído devido a manchas."

"01/09/2026 — Estabilizador — Substituição — Estabilizador antigo estava fazendo barulho."

O histórico deve permanecer salvo no banco de dados e ser exibido em ordem cronológica, do mais recente para o mais antigo.

Criar uma interface profissional, limpa e simples, adequada para utilização pela equipe de TI da clínica.

Na página inicial, apresentar os três andares e a quantidade de consultórios em cada um.

Também criar uma busca para localizar rapidamente um consultório ou médico.

Criar um painel mostrando quantos consultórios estão com equipamentos OK, em atenção ou com problemas.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://otos-room-watch.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8fdcd2ec-5362-40e4-b956-37158990616c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
