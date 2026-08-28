import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  FileText,
  Download,
  Send,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  Activity,
  HeartPulse,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ConfiguracaoClinica,
  EvolucaoClinica,
  Paciente,
} from '../types';
import {
  baixarRelatorioPDF,
  gerarTextoWhatsAppEvolucao,
  abrirWhatsAppComTexto,
} from '../services/pdfGenerator';

interface PacientesCRMViewProps {
  pacientes: Paciente[];
  evolucoes: EvolucaoClinica[];
  configClinica: ConfiguracaoClinica;
  onNovoPaciente: (paciente: Paciente) => void;
  onEditarPaciente: (paciente: Paciente) => void;
  onExcluirPaciente: (pacienteId: string) => void;
  onAbrirNovaEvolucao: (paciente: Paciente) => void;
  onEditarEvolucao: (evolucao: EvolucaoClinica, paciente: Paciente) => void;
  onExcluirEvolucao: (evolucaoId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PacientesCRMView: React.FC<PacientesCRMViewProps> = ({
  pacientes,
  evolucoes,
  configClinica,
  onNovoPaciente,
  onEditarPaciente,
  onExcluirPaciente,
  onAbrirNovaEvolucao,
  onEditarEvolucao,
  onExcluirEvolucao,
  onShowToast,
}) => {
  const [busca, setBusca] = useState('');
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>(pacientes[0]?.id || '');
  const [modalNovoPaciente, setModalNovoPaciente] = useState(false);
  const [editandoPaciente, setEditandoPaciente] = useState<Paciente | null>(null);

  // Form state for new/edit patient
  const [formNome, setFormNome] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDataNasc, setFormDataNasc] = useState('');
  const [formProfissao, setFormProfissao] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [formQueixa, setFormQueixa] = useState('');
  const [formHistorico, setFormHistorico] = useState('');
  const [formMedicacoes, setFormMedicacoes] = useState('');
  const [formAlergias, setFormAlergias] = useState('');
  const [formAtividade, setFormAtividade] = useState<'sedentario' | 'leve' | 'moderado' | 'intenso'>('leve');

  const filteredPacientes = pacientes.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.whatsapp.includes(busca) ||
      p.profissao.toLowerCase().includes(busca.toLowerCase())
  );

  const selectedPaciente = pacientes.find((p) => p.id === selectedPacienteId) || filteredPacientes[0] || pacientes[0];
  const pacienteEvolucoes = selectedPaciente
    ? evolucoes
        .filter((e) => e.pacienteId === selectedPaciente.id)
        .sort((a, b) => b.dataSessao.localeCompare(a.dataSessao))
    : [];

  const abrirModalCadastro = (pac?: Paciente) => {
    if (pac) {
      setEditandoPaciente(pac);
      setFormNome(pac.nome);
      setFormWhatsapp(pac.whatsapp);
      setFormEmail(pac.email || '');
      setFormDataNasc(pac.dataNascimento || '');
      setFormProfissao(pac.profissao || '');
      setFormCpf(pac.cpf || '');
      setFormEndereco(pac.endereco || '');
      setFormQueixa(pac.queixaInicial || '');
      setFormHistorico(pac.historicoMedico || '');
      setFormMedicacoes(pac.medicacoesUso || '');
      setFormAlergias(pac.contraindicacoesAlergias || '');
      setFormAtividade(pac.nivelAtividadeFisica || 'leve');
    } else {
      setEditandoPaciente(null);
      setFormNome('');
      setFormWhatsapp('');
      setFormEmail('');
      setFormDataNasc('');
      setFormProfissao('');
      setFormCpf('');
      setFormEndereco('');
      setFormQueixa('');
      setFormHistorico('');
      setFormMedicacoes('');
      setFormAlergias('');
      setFormAtividade('leve');
    }
    setModalNovoPaciente(true);
  };

  const handleSalvarPaciente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formWhatsapp.trim()) {
      onShowToast('Atenção', 'Nome e WhatsApp são obrigatórios.', 'error');
      return;
    }

    if (editandoPaciente) {
      const atualizado: Paciente = {
        ...editandoPaciente,
        nome: formNome,
        whatsapp: formWhatsapp,
        email: formEmail,
        dataNascimento: formDataNasc,
        profissao: formProfissao,
        cpf: formCpf,
        endereco: formEndereco,
        queixaInicial: formQueixa,
        historicoMedico: formHistorico,
        medicacoesUso: formMedicacoes,
        contraindicacoesAlergias: formAlergias,
        nivelAtividadeFisica: formAtividade,
      };
      onEditarPaciente(atualizado);
      onShowToast('Paciente Atualizado', formNome, 'success');
    } else {
      const novo: Paciente = {
        id: `pac-${Date.now()}`,
        nome: formNome,
        whatsapp: formWhatsapp,
        email: formEmail,
        dataNascimento: formDataNasc,
        profissao: formProfissao,
        cpf: formCpf,
        endereco: formEndereco,
        queixaInicial: formQueixa,
        historicoMedico: formHistorico,
        medicacoesUso: formMedicacoes,
        contraindicacoesAlergias: formAlergias,
        nivelAtividadeFisica: formAtividade,
        dataCadastro: new Date().toISOString().split('T')[0],
        totalSessoes: 0,
      };
      onNovoPaciente(novo);
      setSelectedPacienteId(novo.id);
      onShowToast('Paciente Cadastrado', formNome, 'success');
    }

    setModalNovoPaciente(false);
  };

  const handleExportarPDF = (evo: EvolucaoClinica) => {
    if (!selectedPaciente) return;
    baixarRelatorioPDF(evo, selectedPaciente, configClinica);
    onShowToast('PDF Gerado!', 'Relatório clínico com logo e marca d\'água salvo com sucesso.', 'success');
  };

  const handleEnviarWhatsApp = (evo: EvolucaoClinica) => {
    if (!selectedPaciente) return;
    const msg = gerarTextoWhatsAppEvolucao(evo, selectedPaciente, configClinica);
    abrirWhatsAppComTexto(selectedPaciente.whatsapp, msg);
    onShowToast('WhatsApp Aberto', 'Mensagem da evolução formatada.', 'info');
  };

  return (
    <div id="view-pacientes-crm" className="space-y-3.5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            CRM Clínico & Prontuário de Pacientes
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Anamnese, histórico de sessões, evolução de dor (EVA), relatórios em PDF com marca d'água e WhatsApp.
          </p>
        </div>

        <button
          id="btn-cadastrar-paciente"
          onClick={() => abrirModalCadastro()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Cadastrar Paciente</span>
        </button>
      </div>

      {/* 2-Column CRM Layout: Left list / Right Detailed Clinical Record */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Col: Patient List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 p-3 space-y-2.5 shadow-2xs">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar paciente por nome, tel..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* List items */}
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-0.5">
            {filteredPacientes.map((pac) => {
              const isSelected = selectedPaciente?.id === pac.id;
              const evolucoesCount = evolucoes.filter((e) => e.pacienteId === pac.id).length;

              return (
                <div
                  key={pac.id}
                  onClick={() => setSelectedPacienteId(pac.id)}
                  className={`p-2.5 rounded-md border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs border-l-3 border-l-emerald-600'
                      : 'border-slate-100 hover:border-slate-300 bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{pac.nome}</h4>
                    <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      {evolucoesCount} {evolucoesCount === 1 ? 'sessão' : 'sessões'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {pac.profissao || 'Paciente'} • <span className="font-mono">{pac.whatsapp}</span>
                  </p>

                  {pac.queixaInicial && (
                    <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">
                      "{pac.queixaInicial}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Detailed Clinical Record & Evolution Timeline (8 cols) */}
        {selectedPaciente ? (
          <div className="lg:col-span-8 space-y-3.5">
            {/* Patient Header Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                      {selectedPaciente.nome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {selectedPaciente.nome}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {selectedPaciente.profissao || 'Profissão não informada'} • Cadastrado em {new Date(selectedPaciente.dataCadastro + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => abrirModalCadastro(selectedPaciente)}
                    className="p-1.5 px-2.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-md border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Editar dados cadastrais"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar Ficha</span>
                  </button>

                  <button
                    id="btn-nova-evolucao-prontuario"
                    onClick={() => onAbrirNovaEvolucao(selectedPaciente)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Evolução</span>
                  </button>
                </div>
              </div>

              {/* Anamnese & Clinical Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 space-y-0.5">
                  <span className="font-bold text-[11px] text-slate-700 block">Queixa Principal / Motivo:</span>
                  <p className="text-slate-600 leading-snug">
                    {selectedPaciente.queixaInicial || 'Não informado no cadastro.'}
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 space-y-0.5">
                  <span className="font-bold text-[11px] text-slate-700 block">Histórico & Cirurgias:</span>
                  <p className="text-slate-600 leading-snug">
                    {selectedPaciente.historicoMedico || 'Nenhum histórico informado.'}
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 space-y-0.5">
                  <span className="font-bold text-[11px] text-slate-700 block">Medicações em Uso:</span>
                  <p className="text-slate-600 leading-snug">
                    {selectedPaciente.medicacoesUso || 'Nenhum medicamento contínuo.'}
                  </p>
                </div>

                <div className="bg-amber-50/70 p-2.5 rounded-md border border-amber-200/60 space-y-0.5">
                  <span className="font-bold text-[11px] text-amber-900 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    Contraindicações / Alergias:
                  </span>
                  <p className="text-amber-800 leading-snug">
                    {selectedPaciente.contraindicacoesAlergias || 'Nenhuma alergia conhecida.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Evolution History & Reports Timeline */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Atendimentos & Evoluções ({pacienteEvolucoes.length})
                </h3>
                <span className="text-[11px] text-slate-500">
                  PDF com marca d'água & WhatsApp
                </span>
              </div>

              {pacienteEvolucoes.length === 0 ? (
                <div className="bg-white rounded-lg p-6 text-center border border-slate-200 space-y-2">
                  <p className="text-xs text-slate-500">
                    Ainda não há evoluções registradas para este paciente.
                  </p>
                  <button
                    onClick={() => onAbrirNovaEvolucao(selectedPaciente)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar 1ª Evolução</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pacienteEvolucoes.map((evo) => {
                    const dataFormatada = new Date(evo.dataSessao + 'T12:00:00Z').toLocaleDateString('pt-BR');
                    const melhora = evo.evaInicial > 0
                      ? Math.round(((evo.evaInicial - evo.evaFinal) / evo.evaInicial) * 100)
                      : 0;

                    return (
                      <div
                        key={evo.id}
                        className="bg-white rounded-lg border border-slate-200 p-3 sm:p-3.5 shadow-2xs space-y-2.5 hover:border-slate-300 transition-colors"
                      >
                        {/* Header of session card */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {dataFormatada}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">{evo.procedimentoRealizado}</h4>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Terapeuta: {evo.terapeutaResponsavel}
                            </p>
                          </div>

                          {/* EVA Pain Rating Badge */}
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-xs self-start sm:self-auto">
                            <span className="text-slate-500 text-[11px]">Dor EVA:</span>
                            <span className="font-bold text-rose-600 font-mono">{evo.evaInicial}/10</span>
                            <span className="text-slate-400 text-xs">➔</span>
                            <span className="font-bold text-emerald-600 font-mono">{evo.evaFinal}/10</span>
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded">
                              -{melhora}%
                            </span>
                          </div>
                        </div>

                        {/* Treated areas chips */}
                        {evo.regioesTrabalhadas.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {evo.regioesTrabalhadas.map((r) => (
                              <span
                                key={r}
                                className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Content text */}
                        <div className="space-y-1.5 text-xs text-slate-700">
                          {evo.queixaPrincipal && (
                            <div>
                              <strong className="text-slate-800">Queixa: </strong>
                              <span>{evo.queixaPrincipal}</span>
                            </div>
                          )}
                          {evo.manobrasAplicadas && (
                            <div>
                              <strong className="text-slate-800">Manobras & Técnicas: </strong>
                              <span>{evo.manobrasAplicadas}</span>
                            </div>
                          )}
                          {evo.reacaoTecidual && (
                            <div>
                              <strong className="text-slate-800">Resposta / Fáscia: </strong>
                              <span>{evo.reacaoTecidual}</span>
                            </div>
                          )}
                          {evo.orientacoesCasa && (
                            <div className="bg-emerald-50/50 p-2 rounded-md border border-emerald-100 text-xs">
                              <strong className="text-emerald-900 block text-[11px] mb-0.5">Orientações para Casa:</strong>
                              <p className="text-emerald-800 whitespace-pre-line">{evo.orientacoesCasa}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions bar: Export PDF, WhatsApp, Edit */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              id={`btn-pdf-evo-${evo.id}`}
                              onClick={() => handleExportarPDF(evo)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                              title="Baixar Relatório Oficial com Timbre e Marca d'Água"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Baixar PDF (Marca d'Água)</span>
                            </button>

                            <button
                              id={`btn-whats-evo-${evo.id}`}
                              onClick={() => handleEnviarWhatsApp(evo)}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                              title="Enviar resumo clínico no WhatsApp do paciente"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Enviar via WhatsApp</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onEditarEvolucao(evo, selectedPaciente)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Editar evolução"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onExcluirEvolucao(evo.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Excluir evolução"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal Cadastro/Edição de Paciente */}
      {modalNovoPaciente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-6">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editandoPaciente ? 'Editar Ficha do Paciente' : 'Cadastrar Novo Paciente'}
              </h3>
              <button
                onClick={() => setModalNovoPaciente(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarPaciente} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">WhatsApp com DDD *</label>
                  <input
                    type="tel"
                    required
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={formDataNasc}
                    onChange={(e) => setFormDataNasc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Profissão</label>
                  <input
                    type="text"
                    placeholder="Ex: Arquiteta, Advogado..."
                    value={formProfissao}
                    onChange={(e) => setFormProfissao(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">CPF</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formCpf}
                    onChange={(e) => setFormCpf(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nível de Atividade Física</label>
                  <select
                    value={formAtividade}
                    onChange={(e) => setFormAtividade(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                  >
                    <option value="sedentario">Sedentário</option>
                    <option value="leve">Leve (1-2x semana)</option>
                    <option value="moderado">Moderado (3-4x semana)</option>
                    <option value="intenso">Intenso / Atleta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Endereço</label>
                <input
                  type="text"
                  placeholder="Rua, número, bairro e cidade"
                  value={formEndereco}
                  onChange={(e) => setFormEndereco(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Queixa Principal Inicial</label>
                  <textarea
                    rows={2}
                    placeholder="O que motivou a procura pela massoterapia/fisioterapia..."
                    value={formQueixa}
                    onChange={(e) => setFormQueixa(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Histórico Médico / Cirurgias</label>
                  <input
                    type="text"
                    placeholder="Cirurgias prévias, fraturas, hérnias de disco, etc."
                    value={formHistorico}
                    onChange={(e) => setFormHistorico(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contraindicações / Alergias a óleos/cremes</label>
                  <input
                    type="text"
                    placeholder="Sensibilidade a fragrâncias, óleo mineral, arnica..."
                    value={formAlergias}
                    onChange={(e) => setFormAlergias(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoPaciente(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-xs"
                >
                  Salvar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
