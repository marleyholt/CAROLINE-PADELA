import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Instagram,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  Activity,
  Flame,
  Droplets,
  Award,
  Zap,
  Lock,
  UserCheck,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { ConfiguracaoClinica, Procedimento } from '../types';

interface LandingPageViewProps {
  configClinica: ConfiguracaoClinica;
  procedimentos: Procedimento[];
  onIrParaAgendamento: () => void;
  onIrParaCRM: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  configClinica,
  procedimentos,
  onIrParaAgendamento,
  onIrParaCRM,
}) => {
  const whatsappUrl = `https://wa.me/5521975134597?text=${encodeURIComponent(
    'Olá Caroline! Gostaria de informações sobre agendamento de sessão de Liberação Miofascial e Massoterapia.'
  )}`;

  const instagramUrl = 'https://www.instagram.com/carolpadela/';
  const googleMapsUrl =
    'https://www.google.com/maps/search/?api=1&query=R.+Bar%C3%A3o+de+Inoa,+58+-+Centro,+Maric%C3%A1+-+RJ';

  return (
    <div id="landing-page-caroline-padela" className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500 selection:text-neutral-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur-md border-b border-neutral-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand / Logo */}
          <div className="flex items-center gap-3">
            {configClinica.logoUrl ? (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-neutral-900 border border-emerald-500/40 overflow-hidden flex items-center justify-center p-1 shadow-lg shadow-emerald-950/30">
                <img
                  src={configClinica.logoUrl}
                  alt={configClinica.nomeClinica || 'Caroline Padela'}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/30">
                <span className="font-extrabold text-base sm:text-lg tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                  CP
                </span>
              </div>
            )}
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-white block leading-none">
                {configClinica.nomeClinica ? configClinica.nomeClinica.toUpperCase() : 'CAROLINE PADELA'}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-emerald-400 uppercase tracking-widest block mt-1">
                {configClinica.especialidade || 'Liberação Miofascial & Massoterapia'}
              </span>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Direct Instagram Link */}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors border border-transparent hover:border-neutral-800"
              title="Instagram @carolpadela"
            >
              <Instagram className="w-4 h-4 text-emerald-400" />
              <span>@carolpadela</span>
            </a>

            {/* Discreet CRM Link */}
            <button
              id="btn-acesso-crm-discreto"
              onClick={onIrParaCRM}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium text-neutral-400 hover:text-emerald-300 hover:bg-neutral-900/90 transition-all border border-neutral-800/80 cursor-pointer"
              title="Acesso restrito ao prontuário, financeiro e gestão"
            >
              <Lock className="w-3 h-3 text-emerald-500" />
              <span className="hidden sm:inline">Área da Terapeuta</span>
              <span className="sm:hidden">CRM</span>
            </button>

            {/* Main CTA: Booking */}
            <button
              id="btn-nav-agendar-sessao"
              onClick={onIrParaAgendamento}
              className="inline-flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Sessão</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 border-b border-neutral-800/60">
        {/* Background glow effects */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Col: Main Copy */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
              {/* City Tag & Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Maricá - RJ • Centro (R. Barão de Inoa, 58)</span>
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Livre-se das dores, melhore sua postura e alcance a{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                  recuperação muscular de alto rendimento.
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-sm sm:text-base text-neutral-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Atendimento personalizado em <strong>Liberação Miofascial clínica e esportiva</strong>, Massagem Terapêutica, Ventosaterapia e Drenagem Linfática por <strong>Caroline Padela</strong>.
              </p>

              {/* Quote from Instagram profile */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-900/90 border-l-4 border-emerald-500 border-neutral-800 text-left">
                <p className="text-xs sm:text-sm italic text-neutral-200 leading-snug">
                  "Mounjaro é com médico. Treino é com personal. Dieta é com nutricionista.{' '}
                  <strong className="text-emerald-400 not-italic">Liberação Miofascial & Recuperação de Elite é COMIGO!</strong>"
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
                  <span className="font-semibold text-neutral-300">Caroline Padela • Terapeuta Corporal</span>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <Instagram className="w-3 h-3" /> @carolpadela
                  </a>
                </div>
              </div>

              {/* CTA Button Group */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  id="btn-hero-agendamento"
                  onClick={onIrParaAgendamento}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agendar Horário Online</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  id="btn-hero-whatsapp"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold bg-neutral-900 hover:bg-neutral-850 text-white border border-neutral-700/80 hover:border-emerald-500/50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp (21) 97513-4597</span>
                </a>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-neutral-800/80 text-center">
                <div className="p-2 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <div className="text-xs sm:text-sm font-bold text-white">+670</div>
                  <div className="text-[10px] text-neutral-400">Seguidores no Insta</div>
                </div>
                <div className="p-2 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <div className="text-xs sm:text-sm font-bold text-emerald-400">100%</div>
                  <div className="text-[10px] text-neutral-400">Individualizado</div>
                </div>
                <div className="p-2 rounded-lg bg-neutral-900/50 border border-neutral-800">
                  <div className="text-xs sm:text-sm font-bold text-teal-400">Centro</div>
                  <div className="text-[10px] text-neutral-400">Maricá - RJ</div>
                </div>
              </div>
            </div>

            {/* Right Col: Visual Card / Highlights */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 p-5 sm:p-6 shadow-2xl space-y-4">
                {/* Visual Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white">Especialidades Clínicas</h3>
                      <p className="text-[10px] text-neutral-400">Caroline Padela • Massoterapeuta</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                    Maricá
                  </span>
                </div>

                {/* Specialties List */}
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 flex items-start gap-3 hover:border-emerald-500/40 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Liberação Miofascial Clínica & Esportiva</h4>
                      <p className="text-[11px] text-neutral-400 leading-snug mt-0.5">
                        Desativação de pontos-gatilho, ganho de flexibilidade e recuperação de lesões para atletas e corredores.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 flex items-start gap-3 hover:border-emerald-500/40 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Massagem Relaxante & Aromaterapia</h4>
                      <p className="text-[11px] text-neutral-400 leading-snug mt-0.5">
                        Alívio profundo do estresse, relaxamento da musculatura e melhora expressiva na qualidade do sono.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 flex items-start gap-3 hover:border-emerald-500/40 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Flame className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Ventosaterapia & Recovery</h4>
                      <p className="text-[11px] text-neutral-400 leading-snug mt-0.5">
                        Aumento da circulação local, descompressão fascial e eliminação rápida da sensação de queimação pós-treino.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 flex items-start gap-3 hover:border-emerald-500/40 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Droplets className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Drenagem Linfática & Hot Detox</h4>
                      <p className="text-[11px] text-neutral-400 leading-snug mt-0.5">
                        Redução de inchaço, desintoxicação tecidual e alívio da retenção hídrica em membros inferiores.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Action */}
                <button
                  onClick={onIrParaAgendamento}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-white border border-neutral-700 hover:border-emerald-500/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Ver Todos os Procedimentos e Horários</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Motivos para marcar uma massagem (Extraído diretamente do post do Instagram @carolpadela) */}
      <section className="py-14 sm:py-20 bg-neutral-900/50 border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10 sm:mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Destaque @carolpadela
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              3 Motivos para Marcar sua Sessão Hoje
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Transforme o seu dia com um momento de pausa, renovação celular e alívio duradouro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-white">Redução do Estresse & Ansiedade</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                As manobras terapêuticas estimulam o sistema nervoso parassimpático, diminuindo o cortisol e induzindo uma sensação profunda de calma e renovação.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-white">Melhora da Circulação Sanguínea</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Aumenta o aporte de oxigênio e nutrientes aos tecidos musculares, acelerando a drenagem de resíduos metabólicos e aliviando a sensação de peso.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-white">Alívio de Tensões & Dores Crônicas</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Liberação de fáscia e pontos-gatilho (trigger points) na cervical, trapézio, lombar e pernas, restaurando a amplitude natural de movimento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recovery Esportivo & Corredores */}
      <section className="py-14 sm:py-20 border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>Performance & Recovery de Elite</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                O Segredo por trás do Pace Alto e Pernas Leves
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Atletas de corrida (5km, 10km, 21km, 42km), praticantes de crossfit e musculação sabem que o resultado do treino depende da qualidade da recuperação muscular.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Prevenção ativa de contraturas, canelite e fascite plantar.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Descompressão da fáscia toracolombar, glúteos e isquiotibiais.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ventosaterapia dinâmica para acelerar o retorno aos treinos.</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  onClick={onIrParaAgendamento}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agendar Minha Liberação Miofascial</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm text-white">Protocolo BioSculp & Hot Detox</span>
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                  Destaque
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Tratamento corporal focado em remodelagem, desintoxicação tecidual profunda e redução de medidas através de massagem modeladora e calor terapêutico.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center">
                  <div className="text-xs text-neutral-400 font-medium">Pacote 4 Sessões</div>
                  <div className="text-base sm:text-lg font-extrabold text-emerald-400 mt-0.5">R$ 479</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-center">
                  <div className="text-xs text-neutral-400 font-medium">Pacote 8 Sessões</div>
                  <div className="text-base sm:text-lg font-extrabold text-emerald-400 mt-0.5">R$ 799</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Localização & Contato */}
      <section className="py-14 sm:py-20 bg-neutral-900/40 border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Info */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Localização & Atendimento
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Espaço Terapêutico Caroline Padela
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300">
                Ambiente confortável, higienizado e climatizado no coração de Maricá, pronto para acolher você com todo o cuidado e biossegurança.
              </p>

              <div className="space-y-3 pt-2 text-xs sm:text-sm">
                <div className="flex items-start gap-3 text-neutral-300">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Endereço:</strong>
                    <span>R. Barão de Inoa, 58 - Sobreloja - Centro, Maricá - RJ, 24901-010</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-neutral-300">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">WhatsApp & Telefone:</strong>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                      (21) 97513-4597
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-neutral-300">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Horário de Atendimento:</strong>
                    <span>Segunda a Sábado com agendamento prévio.</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-3">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold border border-neutral-700 inline-flex items-center gap-1.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ver no Google Maps</span>
                </a>

                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold border border-neutral-700 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instagram @carolpadela</span>
                </a>
              </div>
            </div>

            {/* CTA Box */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-neutral-900 via-neutral-900 to-emerald-950/40 border border-emerald-500/30 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Pronto para agendar seu momento?
              </h3>
              <p className="text-xs text-neutral-300 max-w-sm mx-auto">
                Escolha o procedimento, o melhor dia e horário e receba sua confirmação em poucos cliques.
              </p>
              <button
                id="btn-footer-agendar"
                onClick={onIrParaAgendamento}
                className="w-full py-3 px-5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                Agendar Sessão Online Agora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 bg-neutral-950 text-neutral-400 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
              CP
            </div>
            <div>
              <span className="font-bold text-white block">Caroline Padela • Liberação Miofascial & Massoterapia</span>
              <span className="text-[10px] text-neutral-400">R. Barão de Inoa, 58 - Sobreloja - Centro, Maricá - RJ</span>
            </div>
          </div>

          {/* Discreet Access Link */}
          <div className="flex items-center gap-4">
            <button
              id="btn-footer-crm-discreto"
              onClick={onIrParaCRM}
              className="text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer py-1 px-2 rounded hover:bg-neutral-900"
              title="Acesso restrito da terapeuta ao CRM"
            >
              <Lock className="w-3 h-3" />
              <span>Acesso Terapeuta / CRM</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
