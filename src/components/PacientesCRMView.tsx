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
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Camera,
  ImageIcon,
} from 'lucide-react';
import {
  ConfiguracaoClinica,
  EvolucaoClinica,
  Paciente,
  Procedimento,
} from '../types';
import {
  baixarRelatorioPDF,
  gerarTextoWhatsAppEvolucao,
  abrirWhatsAppComTexto,
  enviarRelatorioAtendimentoWhatsAppComPDF,
} from '../services/pdfGenerator';
import { RelatorioDesenvolvimentoModal } from './RelatorioDesenvolvimentoModal';

interface PacientesCRMViewProps {
  pacientes: Paciente[];
  evolucoes: EvolucaoClinica[];
  procedimentos?: Procedimento[];
  configClinica: ConfiguracaoClinica;
  onNovoPaciente: (paciente: Paciente) => void;
  onEditarPaciente: (paciente: Paciente) => void;
  onExcluirPaciente: (pacienteId: string) => void;
  onAbrirNovaEvolucao?: (paciente: Paciente) => void;
  onAdicionarSessao?: (paciente: Paciente) => void;
  onNovaEvolucao?: (paciente: Paciente) => void;
  onEditarEvolucao: (evolucao: EvolucaoClinica, paciente: Paciente) => void;
  onExcluirEvolucao: (evolucaoId: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PacientesCRMView: React.FC<PacientesCRMViewProps> = ({
  pacientes,
  evolucoes,
  procedimentos = [],
  configClinica,
  onNovoPaciente,
  onEditarPaciente,
  onExcluirPaciente,
  onAbrirNovaEvolucao,
  onAdicionarSessao,
  onNovaEvolucao,
  onEditarEvolucao,
  onExcluirEvolucao,
  onShowToast,
}) => {
  const [busca, setBusca] = useState('');
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>(pacientes[0]?.id || '');
  const [modalNovoPaciente, setModalNovoPaciente] = useState(false);
  const [modalRelatorioDesenvolvimento, setModalRelatorioDesenvolvimento] = useState(false);
  const [editandoPaciente, setEditandoPaciente] = useState<Paciente | null>(null);
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState<Paciente | null>(null);

  // Form state for new/edit patient
  const [formNome, setFormNome] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDataNasc, setFormDataNasc] = useState('');
  const [formProfissao, setFormProfissao] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [formPeso, setFormPeso] = useState('');
  const [formAltura, setFormAltura] = useState('');
  const [formIdade, setFormIdade] = useState('');
  const [formQueixa, setFormQueixa] = useState('');
  const [formHistorico, setFormHistorico] = useState('');
  const [formMedicacoes, setFormMedicacoes] = useState('');
  const [formAlergias, setFormAlergias] = useState('');
  const [formAtividade, setFormAtividade] = useState<'sedentario' | 'leve' | 'moderado' | 'intenso'>('leve');

  // Trigger add session safely across different prop names
  const handleTriggerAdicionarSessao = (pac: Paciente) => {
    if (onAdicionarSessao) {
      onAdicionarSessao(pac);
    } else if (onAbrirNovaEvolucao) {
      onAbrirNovaEvolucao(pac);
    } else if (onNovaEvolucao) {
      onNovaEvolucao(pac);
    }
  };

  const filteredPacientes = pacientes.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.whatsapp.includes(busca) ||
      p.profissao.toLowerCase().includes(busca.toLowerCase())
  );

  const selectedPaciente =
    pacientes.find((p) => p.id === selectedPacienteId) || filteredPacientes[0] || pacientes[0];

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
      setFormPeso(pac.peso || '');
      setFormAltura(pac.altura || '');
      setFormIdade(pac.idade !== undefined ? pac.idade.toString() : '');
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
      setFormPeso('');
      setFormAltura('');
      setFormIdade('');
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
        peso: formPeso.trim() ? formPeso.trim() : undefined,
        altura: formAltura.trim() ? formAltura.trim() : undefined,
        idade: formIdade.trim() ? formIdade.trim() : undefined,
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
        peso: formPeso.trim() ? formPeso.trim() : undefined,
        altura: formAltura.trim() ? formAltura.trim() : undefined,
        idade: formIdade.trim() ? formIdade.trim() : undefined,
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
    onShowToast(
      'Relatório de Anamnese (PDF) Gerado!',
      `Documento oficial emitido timbrado (${configClinica.cidadeUf || 'Maricá - RJ'}) com marca d'água de proteção.`,
      'success'
    );
  };

  const handleEnviarWhatsApp = (evo: EvolucaoClinica) => {
    if (!selectedPaciente) return;
    enviarRelatorioAtendimentoWhatsAppComPDF(evo, selectedPaciente, configClinica, onShowToast);
  };

  return (
    <div id="view-pacientes-crm" className="space-y-3.5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            CRM Clínico & Prontuário de Pacientes
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Registro de sessões, valor pago, anamnese clínica, dor (EVA) e emissão de Relatórios em PDF sem dados financeiros.
          </p>
        </div>

        <button
          id="btn-cadastrar-paciente"
          onClick={() => abrirModalCadastro()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all shrink-0 cursor-pointer"
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
              const pacienteEvos = evolucoes.filter((e) => e.pacienteId === pac.id);
              const evolucoesCount = pacienteEvos.length;
              const pendentesCount = pacienteEvos.filter((e) => e.statusRelatorio === 'pendente').length;

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
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{pac.nome}</h4>
                    <div className="flex items-center gap-1 shrink-0">
                      {pendentesCount > 0 && (
                        <span className="text-[9px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 text-amber-700" />
                          {pendentesCount} {pendentesCount === 1 ? 'agendada' : 'agendadas'}
                        </span>
                      )}
                      <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                        {evolucoesCount} {evolucoesCount === 1 ? 'sessão' : 'sessões'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {pac.profissao || 'Paciente'} • <span className="font-mono">{pac.whatsapp}</span>
                  </p>

                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100/60">
                    <span className="text-[10px] text-slate-400">
                      Última: {pac.ultimaSessao ? new Date(pac.ultimaSessao + 'T12:00:00Z').toLocaleDateString('pt-BR') : 'Sem registros'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPacienteId(pac.id);
                        handleTriggerAdicionarSessao(pac);
                      }}
                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                      title="Adicionar sessão para este paciente"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>+ Sessão</span>
                    </button>
                  </div>
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
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0 border border-emerald-200">
                      {selectedPaciente.nome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {selectedPaciente.nome}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {selectedPaciente.profissao || 'Profissão não informada'} • Cadastrado em{' '}
                        {new Date(selectedPaciente.dataCadastro + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {pacienteEvolucoes.length > 0 && (
                    <button
                      id="btn-relatorio-desenvolvimento-paciente"
                      onClick={() => setModalRelatorioDesenvolvimento(true)}
                      className="p-1.5 px-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Personalizar e Gerar Relatório Geral de Desenvolvimento com evolução e fotos em PDF"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>Relatório de Desenvolvimento (PDF)</span>
                    </button>
                  )}

                  <button
                    onClick={() => abrirModalCadastro(selectedPaciente)}
                    className="p-1.5 px-2.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-md border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Editar dados cadastrais"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar Ficha</span>
                  </button>

                  <button
                    id="btn-excluir-paciente"
                    onClick={() => setPacienteParaExcluir(selectedPaciente)}
                    className="p-1.5 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Excluir paciente e prontuário"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>

                  <button
                    id="btn-adicionar-sessao-paciente"
                    onClick={() => handleTriggerAdicionarSessao(selectedPaciente)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Sessão</span>
                  </button>
                </div>
              </div>

              {/* Anamnese & Clinical Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Dados Físicos Opcionais (Só aparecem se preenchidos) */}
                {(selectedPaciente.peso || selectedPaciente.altura || (selectedPaciente.idade !== undefined && selectedPaciente.idade !== '')) && (
                  <div className="bg-emerald-50/70 p-2.5 rounded-md border border-emerald-200/80 space-y-1 sm:col-span-2">
                    <span className="font-bold text-[11px] text-emerald-950 flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-emerald-700" />
                      Dados Físicos / Antropométricos (Anamnese):
                    </span>
                    <div className="flex items-center gap-2.5 text-emerald-900 text-xs flex-wrap pt-0.5">
                      {selectedPaciente.idade && (
                        <span className="bg-white/90 px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                          🎂 Idade: <strong>{selectedPaciente.idade} {selectedPaciente.idade.toString().toLowerCase().includes('ano') ? '' : 'anos'}</strong>
                        </span>
                      )}
                      {selectedPaciente.peso && (
                        <span className="bg-white/90 px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                          ⚖️ Peso (Massa): <strong>{selectedPaciente.peso} {selectedPaciente.peso.toLowerCase().includes('kg') ? '' : 'kg'}</strong>
                        </span>
                      )}
                      {selectedPaciente.altura && (
                        <span className="bg-white/90 px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                          📏 Altura: <strong>{selectedPaciente.altura} {selectedPaciente.altura.toLowerCase().includes('m') || selectedPaciente.altura.toLowerCase().includes('cm') ? '' : 'm'}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

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

              {/* Lembrete de Sessão Agendada Pendente de Relatório */}
              {pacienteEvolucoes.some((e) => e.statusRelatorio === 'pendente') && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
                  <div className="p-1 bg-amber-100 text-amber-700 rounded-md shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      Lembrete: Sessão Agendada no Prontuário
                    </span>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Este paciente possui sessão agendada que ainda vai acontecer. O histórico já está preparado para você registrar a evolução clínica e emitir o relatório em PDF assim que concluir o atendimento.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Evolution History & Reports Timeline */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Histórico de Sessões & Anamneses ({pacienteEvolucoes.length})
                </h3>
                <span className="text-[11px] text-slate-500">
                  PDF com marca d'água ({configClinica.cidadeUf || 'Maricá - RJ'}) & WhatsApp
                </span>
              </div>

              {pacienteEvolucoes.length === 0 ? (
                <div className="bg-white rounded-lg p-6 text-center border border-slate-200 space-y-2.5">
                  <p className="text-xs text-slate-500">
                    Ainda não há sessões registradas para este paciente.
                  </p>
                  <button
                    onClick={() => handleTriggerAdicionarSessao(selectedPaciente)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar 1ª Sessão</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pacienteEvolucoes.map((evo) => {
                    const dataFormatada = new Date(evo.dataSessao + 'T12:00:00Z').toLocaleDateString('pt-BR');
                    const isPendente = evo.statusRelatorio === 'pendente';
                    const melhora =
                      evo.evaInicial > 0
                        ? Math.round(((evo.evaInicial - evo.evaFinal) / evo.evaInicial) * 100)
                        : 0;

                    if (isPendente) {
                      return (
                        <div
                          key={evo.id}
                          className="bg-amber-50/40 rounded-lg border-2 border-amber-300 p-3 sm:p-3.5 shadow-2xs space-y-2.5 transition-colors"
                        >
                          {/* Header of pending session card */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-amber-200/80">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                                  Sessão Agendada (Ainda vai acontecer)
                                </span>
                                <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  📅 {dataFormatada} {evo.horario ? `às ${evo.horario}h` : ''}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                  {evo.procedimentoRealizado}
                                </h4>
                                {evo.valorPago !== undefined && evo.valorPago > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                    R$ {evo.valorPago.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Terapeuta Responsável: {evo.terapeutaResponsavel}
                              </p>
                            </div>

                            <span className="text-[10px] font-bold uppercase bg-amber-200/80 text-amber-950 px-2.5 py-1 rounded-md self-start sm:self-auto border border-amber-300">
                              Aguardando Relatório
                            </span>
                          </div>

                          {/* Lembrete Terapeuta */}
                          <div className="bg-amber-100/60 border border-amber-300/70 p-2.5 rounded-md text-xs text-amber-950 space-y-1">
                            <strong className="block text-amber-900 text-[11px]">
                              🔔 Lembrete da Terapeuta:
                            </strong>
                            <p className="text-amber-800 text-[11px] leading-relaxed">
                              Esta sessão foi registrada no agendamento do paciente. Após a realização do atendimento, clique no botão abaixo para preencher a avaliação de dor (EVA), manobras realizadas, resposta tecidual e orientações para gerar o relatório clínico em PDF e mensagem de WhatsApp.
                            </p>
                            {evo.queixaPrincipal && (
                              <div className="pt-1 text-slate-700 text-[11px]">
                                <strong>Observações / Queixa: </strong>
                                <span>{evo.queixaPrincipal}</span>
                              </div>
                            )}
                          </div>

                          {/* Action button: Preencher & Concluir Relatório */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/80 text-xs">
                            <button
                              id={`btn-concluir-relatorio-${evo.id}`}
                              onClick={() => onEditarEvolucao(evo, selectedPaciente)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              title="Preencher relatório clínico, escala de dor e gerar PDF"
                            >
                              <FileText className="w-4 h-4" />
                              <span>📝 Preencher & Concluir Relatório Clínico</span>
                            </button>

                            <button
                              onClick={() => onExcluirEvolucao(evo.id)}
                              className="p-1.5 px-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                              title="Excluir ou cancelar esta sessão"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={evo.id}
                        className="bg-white rounded-lg border border-slate-200 p-3 sm:p-3.5 shadow-2xs space-y-2.5 hover:border-slate-300 transition-colors"
                      >
                        {/* Header of session card */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                📅 {dataFormatada} {evo.horario ? `às ${evo.horario}h` : ''}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                {evo.procedimentoRealizado}
                              </h4>
                              {evo.valorPago !== undefined && evo.valorPago > 0 && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  R$ {evo.valorPago.toFixed(2)}
                                </span>
                              )}
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

                        {/* Treated areas and Body Weight / Fluid Loss chips */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {evo.pesoKg && (
                            <span className="text-[10px] font-bold bg-sky-50 text-sky-900 border border-sky-200 px-2 py-0.5 rounded flex items-center gap-1">
                              ⚖️ Peso Sessão: <strong>{evo.pesoKg} {evo.pesoKg.toString().toLowerCase().includes('kg') ? '' : 'kg'}</strong>
                            </span>
                          )}

                          {evo.pesoFinalSessaoKg && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                              💧 Pós-Drenagem: <strong>{evo.pesoFinalSessaoKg} {evo.pesoFinalSessaoKg.toString().toLowerCase().includes('kg') ? '' : 'kg'}</strong>
                            </span>
                          )}

                          {evo.circunferenciaCm && (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded">
                              📏 {evo.circunferenciaCm}
                            </span>
                          )}

                          {evo.regioesTrabalhadas && evo.regioesTrabalhadas.length > 0 && (
                            evo.regioesTrabalhadas.map((r) => (
                              <span
                                key={r}
                                className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                              >
                                {r}
                              </span>
                            ))
                          )}
                        </div>

                        {/* Content text */}
                        <div className="space-y-1.5 text-xs text-slate-700">
                          {evo.queixaPrincipal && (
                            <div>
                              <strong className="text-slate-800">Queixa / Anamnese: </strong>
                              <span>{evo.queixaPrincipal}</span>
                            </div>
                          )}
                          {evo.manobrasAplicadas && (
                            <div>
                              <strong className="text-slate-800">Manobras & Condutas: </strong>
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
                              <strong className="text-emerald-900 block text-[11px] mb-0.5">
                                Orientações de Autocuidado Domiciliar:
                              </strong>
                              <p className="text-emerald-800 whitespace-pre-line">{evo.orientacoesCasa}</p>
                            </div>
                          )}

                          {/* Comparativos Visuais (Fotos Antes e Depois) da Sessão */}
                          {evo.comparativosVisuais && evo.comparativosVisuais.length > 0 && (
                            <div className="space-y-2 pt-1 border-t border-slate-100">
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                                Comparativo Visual da Sessão ({evo.comparativosVisuais.length} par{evo.comparativosVisuais.length > 1 ? 'es' : ''}):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {evo.comparativosVisuais.map((comp, cIdx) => (
                                  <div
                                    key={comp.id || cIdx}
                                    className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                                      <span>Par #{cIdx + 1}</span>
                                      {comp.descricao && (
                                        <span className="text-slate-400 font-normal italic truncate max-w-[150px]">
                                          {comp.descricao}
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-950 aspect-[3/4] min-h-[180px] sm:min-h-[240px] flex items-center justify-center p-1">
                                        {comp.fotoAntes ? (
                                          <img
                                            src={comp.fotoAntes}
                                            alt="Antes"
                                            className="w-full h-full object-contain"
                                          />
                                        ) : (
                                          <span className="text-[9px] text-slate-400">Sem foto</span>
                                        )}
                                        <span className="absolute top-1.5 left-1.5 bg-rose-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                          ANTES
                                        </span>
                                      </div>
                                      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-950 aspect-[3/4] min-h-[180px] sm:min-h-[240px] flex items-center justify-center p-1">
                                        {comp.fotoDepois ? (
                                          <img
                                            src={comp.fotoDepois}
                                            alt="Depois"
                                            className="w-full h-full object-contain"
                                          />
                                        ) : (
                                          <span className="text-[9px] text-slate-400">Sem foto</span>
                                        )}
                                        <span className="absolute top-1.5 left-1.5 bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                          DEPOIS
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions bar: Export PDF, WhatsApp, Edit */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              id={`btn-pdf-evo-${evo.id}`}
                              onClick={() => handleExportarPDF(evo)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                              title="Baixar Relatório de Anamnese & Evolução com Timbre (Maricá - RJ) e Marca d'Água (Sem dados financeiros)"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Relatório Anamnese (PDF)</span>
                            </button>

                            <button
                              id={`btn-whats-evo-${evo.id}`}
                              onClick={() => handleEnviarWhatsApp(evo)}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                              title="Enviar relatório em PDF com resumo no WhatsApp do paciente"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Enviar WhatsApp com PDF</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onEditarEvolucao(evo, selectedPaciente)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Editar sessão"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onExcluirEvolucao(evo.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir sessão"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                {editandoPaciente ? 'Editar Ficha do Paciente' : 'Novo Paciente & Ficha de Anamnese'}
              </h3>
              <button
                onClick={() => setModalNovoPaciente(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarPaciente} className="p-4 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Maria Silva"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">WhatsApp (com DDD) *</label>
                  <input
                    type="tel"
                    required
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="Ex: 21999999999"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={formDataNasc}
                    onChange={(e) => setFormDataNasc(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Profissão / Ocupação</label>
                  <input
                    type="text"
                    value={formProfissao}
                    onChange={(e) => setFormProfissao(e.target.value)}
                    placeholder="Ex: Arquiteta, Advogado..."
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">CPF</label>
                  <input
                    type="text"
                    value={formCpf}
                    onChange={(e) => setFormCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Endereço / Bairro</label>
                  <input
                    type="text"
                    value={formEndereco}
                    onChange={(e) => setFormEndereco(e.target.value)}
                    placeholder="Maricá - RJ"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Campos Opcionais de Anamnese Física (só aparecem no relatório se preenchidos) */}
                <div className="sm:col-span-2 pt-2 pb-1 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[11px] text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                      Dados Físicos do Paciente (Opcionais)
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium italic">
                      * Só aparecem no relatório se preenchidos
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                        Idade (anos)
                      </label>
                      <input
                        type="text"
                        value={formIdade}
                        onChange={(e) => setFormIdade(e.target.value)}
                        placeholder="Ex: 34"
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                        Peso / Massa (kg)
                      </label>
                      <input
                        type="text"
                        value={formPeso}
                        onChange={(e) => setFormPeso(e.target.value)}
                        placeholder="Ex: 68 kg"
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                        Altura (m / cm)
                      </label>
                      <input
                        type="text"
                        value={formAltura}
                        onChange={(e) => setFormAltura(e.target.value)}
                        placeholder="Ex: 1.72 m"
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider block">
                  Anamnese Inicial & Saúde
                </span>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Queixa Principal / Motivo da Procura</label>
                  <textarea
                    rows={2}
                    value={formQueixa}
                    onChange={(e) => setFormQueixa(e.target.value)}
                    placeholder="Ex: Dor crônica na cervical e trapézio, tensão por estresse no trabalho..."
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Histórico Médico / Cirurgias / Fraturas</label>
                  <input
                    type="text"
                    value={formHistorico}
                    onChange={(e) => setFormHistorico(e.target.value)}
                    placeholder="Ex: Hérnia de disco L4-L5, cirurgia no joelho em 2021..."
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Medicações de Uso Contínuo</label>
                  <input
                    type="text"
                    value={formMedicacoes}
                    onChange={(e) => setFormMedicacoes(e.target.value)}
                    placeholder="Ex: Anti-hipertensivo, ansiolítico..."
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-amber-900 block mb-1">Contraindicações / Alergias a Óleos / Cosméticos</label>
                  <input
                    type="text"
                    value={formAlergias}
                    onChange={(e) => setFormAlergias(e.target.value)}
                    placeholder="Ex: Alergia a óleo mineral, fragrâncias fortes, trombose pregressa..."
                    className="w-full px-2.5 py-1.5 rounded-md border border-amber-200 bg-amber-50/50 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoPaciente(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold shadow-2xs"
                >
                  {editandoPaciente ? 'Salvar Alterações' : 'Cadastrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Excluir Paciente */}
      {pacienteParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Excluir Paciente Definitivamente?</h3>
                <p className="text-xs text-rose-700 font-semibold">{pacienteParaExcluir.nome}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50 p-3 rounded-xl border border-rose-100">
              Atenção: Ao excluir este paciente, todos os seus dados cadastrais, histórico de anamnese e relatórios de evolução clínica associados serão excluídos permanentemente.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPacienteParaExcluir(null)}
                className="px-3.5 py-2 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = pacienteParaExcluir.id;
                  setPacienteParaExcluir(null);
                  onExcluirPaciente(id);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Paciente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Personalização & Emissão do Relatório de Desenvolvimento */}
      {modalRelatorioDesenvolvimento && selectedPaciente && (
        <RelatorioDesenvolvimentoModal
          paciente={selectedPaciente}
          evolucoes={pacienteEvolucoes}
          configClinica={configClinica}
          onClose={() => setModalRelatorioDesenvolvimento(false)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
