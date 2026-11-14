// npm run db:seed — apaga os DADOS (não o esquema) e recarrega os dados de demonstração.
// FONTE DOS DADOS: src/data/mock.ts (a mesma que o app usa hoje). Para mudar atividades,
// níveis ou alunos de exemplo, edite o mock.ts e rode `npm run db:seed`.
// Requer Node 22.18+ (importa o .ts direto, sem compilar).
import { abrirBanco, caminhoBanco, executadoDireto } from "./conectar.mjs";
import { migrar } from "./migrar.mjs";
import { gerarHashSenhaSync } from "./senha.mjs";

/**
 * Senha de TODOS os usuários de demonstração (documentada no README, "Entrar no app").
 * Só para a demo local: nunca use em um servidor de verdade.
 */
export const SENHA_DEMO = "demo1234";

const bool = (v) => (v ? 1 : 0);

// Ordem segura para apagar (filhos antes dos pais).
const TABELAS_DE_DADOS = [
  "DesempenhoConteudo",
  "HistoricoNivel",
  "Resposta",
  "AudioCache",
  "Alternativa",
  "Atividade",
  "Matricula",
  "Turma",
  "Vinculo",
  "Professor",
  "Instituicao",
  "Responsavel",
  "Administrador",
  "Aluno",
  "Usuario",
  "Nivel",
];

export async function semear(db) {
  const mock = await import("../../src/data/mock.ts");
  migrar(db);

  db.exec("BEGIN");
  try {
    for (const t of TABELAS_DE_DADOS) db.exec(`DELETE FROM ${t}`);
    // Zera os contadores AUTOINCREMENT para os ids baterem com o mock.
    db.exec("DELETE FROM sqlite_sequence");

    const inserirNivel = db.prepare(
      "INSERT INTO Nivel (idNivel, nome, descricao, ordem, criterioAcerto) VALUES (?, ?, ?, ?, ?)",
    );
    for (const n of mock.niveis) {
      inserirNivel.run(n.idNivel, n.nome, n.descricao, n.ordem, n.criterioAcerto);
    }

    const inserirUsuario = db.prepare(
      `INSERT INTO Usuario (idUsuario, nome, nomeUsuario, email, telefone, senhaHash, perfil, dataNascimento, ativo, criadoEm, atualizadoEm)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    // Cada usuário ganha o próprio hash (sal diferente), todos da SENHA_DEMO.
    const inserirUsuarioBase = (u) =>
      inserirUsuario.run(
        u.idUsuario, u.nome, u.nomeUsuario ?? null, u.email?.toLowerCase() ?? null, u.telefone ?? null, gerarHashSenhaSync(SENHA_DEMO),
        u.perfil, u.dataNascimento ?? null, bool(u.ativo), u.criadoEm, u.atualizadoEm,
      );

    for (const adm of mock.administradores) {
      inserirUsuarioBase(adm);
      db.prepare("INSERT INTO Administrador (idUsuario) VALUES (?)").run(adm.idUsuario);
    }

    for (const i of mock.instituicoes) {
      inserirUsuarioBase(i);
      db.prepare(
        `INSERT INTO Instituicao (idUsuario, cnpj, nomeResponsavel, codigo, status, motivoRecusa, decididoPor, decididoEm)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(i.idUsuario, i.cnpj, i.nomeResponsavel, i.codigo ?? null, i.status, i.motivoRecusa ?? null,
            i.decididoPor ?? null, i.decididoEm ?? null);
    }

    for (const p of mock.professores) {
      inserirUsuarioBase(p);
      db.prepare(
        `INSERT INTO Professor (idUsuario, idInstituicao, statusVinculo, motivoRecusa, decididoEm)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(p.idUsuario, p.idInstituicao ?? null, p.statusVinculo ?? "PENDENTE", p.motivoRecusa ?? null, p.decididoEm ?? null);
    }
    for (const r of mock.responsaveis) {
      inserirUsuarioBase(r);
      db.prepare("INSERT INTO Responsavel (idUsuario) VALUES (?)").run(r.idUsuario);
    }
    for (const a of mock.alunos) {
      inserirUsuarioBase(a);
      db.prepare(
        `INSERT INTO Aluno (idUsuario, vozPreferida, velocidadeVoz, tamanhoFonte, idNivelInicial)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(a.idUsuario, a.vozPreferida, a.velocidadeVoz, a.tamanhoFonte, a.idNivelInicial ?? null);
    }
    for (const v of mock.vinculos) {
      db.prepare(
        `INSERT INTO Vinculo (idVinculo, idAluno, idAcompanhante, status, identificadorConvite, criadoEm, decididoEm)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(v.idVinculo, v.idAluno, v.idAcompanhante, v.status, v.identificadorConvite ?? null, v.criadoEm, v.decididoEm ?? null);
    }

    for (const t of mock.turmas) {
      db.prepare("INSERT INTO Turma (idTurma, nome, periodo, ativa, idProfessor) VALUES (?, ?, ?, ?, ?)")
        .run(t.idTurma, t.nome, t.periodo, bool(t.ativa), t.idProfessor);
    }
    for (const m of mock.matriculas) {
      db.prepare("INSERT INTO Matricula (idAluno, idTurma, dataVinculo) VALUES (?, ?, ?)")
        .run(m.idAluno, m.idTurma, m.dataVinculo);
    }

    // Atividades e alternativas
    for (const at of mock.atividades) {
      const posicao = mock.idsAtividadesNivelamento.indexOf(at.idAtividade);
      db.prepare(
        `INSERT INTO Atividade (idAtividade, idNivel, tipo, conteudo, enunciado, textoApoio, urlImagem, respostaCorreta,
                                status, ordemNivelamento, criadoEm, atualizadoEm)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        at.idAtividade, at.idNivel, at.tipo, at.conteudo, at.enunciado, at.textoApoio ?? null, at.urlImagem ?? null,
        at.respostaCorreta, at.status, posicao >= 0 ? posicao + 1 : null, at.criadoEm, at.atualizadoEm,
      );
      for (const alt of at.alternativas) {
        db.prepare(
          `INSERT INTO Alternativa (idAlternativa, idAtividade, texto, ordem, correta, urlImagem, ilustracao)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).run(alt.idAlternativa, at.idAtividade, alt.texto, alt.ordem, bool(alt.correta),
              alt.urlImagem ?? null, alt.ilustracao ?? null);
      }
    }

    // Respostas de exemplo + desempenho por conteúdo (calculado a partir delas)
    const atividadePorId = new Map(mock.atividades.map((a) => [a.idAtividade, a]));
    const desempenho = new Map();
    for (const r of mock.respostas) {
      db.prepare(
        `INSERT INTO Resposta (idResposta, idAluno, idAtividade, respostaDada, correta, dataHora,
                               tempoRespostaSeg, correcaoProfessor)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(r.idResposta, r.idAluno, r.idAtividade, r.respostaDada, bool(r.correta), r.dataHora,
            r.tempoRespostaSeg, r.correcaoProfessor ?? null);

      const at = atividadePorId.get(r.idAtividade);
      const chave = `${r.idAluno}|${at.idNivel}|${at.conteudo}`;
      const d = desempenho.get(chave) ?? { idAluno: r.idAluno, idNivel: at.idNivel, conteudo: at.conteudo, tentativas: 0, acertos: 0 };
      d.tentativas += 1;
      d.acertos += r.correta ? 1 : 0;
      desempenho.set(chave, d);
    }
    const agora = new Date().toISOString();
    for (const d of desempenho.values()) {
      db.prepare(
        `INSERT INTO DesempenhoConteudo (idAluno, idNivel, conteudo, totalTentativas, totalAcertos, taxaAcerto, atualizadoEm)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(d.idAluno, d.idNivel, d.conteudo, d.tentativas, d.acertos, d.acertos / d.tentativas, agora);
    }

    // Histórico de nível: o nível atual do aluno é o último registro daqui.
    for (const a of mock.alunos) {
      const inserirHistorico = (idNivel, data) =>
        db.prepare("INSERT INTO HistoricoNivel (idAluno, idNivel, dataMudanca) VALUES (?, ?, ?)")
          .run(a.idUsuario, idNivel, data);
      if (a.idNivelInicial != null) inserirHistorico(a.idNivelInicial, a.criadoEm);
      if (a.idNivelAtual != null && a.idNivelAtual !== a.idNivelInicial) inserirHistorico(a.idNivelAtual, agora);
    }

    db.exec("COMMIT");
  } catch (erro) {
    db.exec("ROLLBACK");
    throw erro;
  }
}

if (executadoDireto(import.meta.url)) {
  const db = abrirBanco();
  await semear(db);
  console.log(`Banco: ${caminhoBanco}`);
  for (const t of ["Nivel", "Usuario", "Aluno", "Professor", "Responsavel", "Instituicao", "Administrador", "Vinculo", "Turma", "Matricula", "Atividade", "Alternativa", "Resposta", "DesempenhoConteudo", "HistoricoNivel"]) {
    const { total } = db.prepare(`SELECT COUNT(*) AS total FROM ${t}`).get();
    console.log(`  ${t.padEnd(20)} ${total}`);
  }
  db.close();
  console.log(`Senha de todos os usuários de demonstração: ${SENHA_DEMO}`);
}
