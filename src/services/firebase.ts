import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Agendamento,
  ConfiguracaoClinica,
  ConfiguracaoInter,
  EvolucaoClinica,
  Paciente,
  Procedimento,
  TransacaoFinanceira,
  UsuarioTerapeuta,
  ConfiguracaoAcessos,
} from '../types';

export const MASTER_EMAIL = 'leaog.8@gmail.com';
export const TEST_MASTER_EMAIL = 'adm@adm.com';
export const TEST_MASTER_PASSWORD = '111111';
export const MASTER_EMAILS = ['leaog.8@gmail.com', 'adm@adm.com'];
export const DEFAULT_CHAVE_ACESSO = 'terapia2026';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
// Workspace Scopes
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');

// In-memory cache for Google OAuth Access Token
let cachedGoogleAccessToken: string | null = null;

export function getCachedGoogleAccessToken(): string | null {
  return cachedGoogleAccessToken;
}

export function setCachedGoogleAccessToken(token: string | null): void {
  cachedGoogleAccessToken = token;
}

// Use default or specified firestore database
const rawConfig = firebaseConfig as any;
export const db = (rawConfig.firestoreDatabaseId && rawConfig.firestoreDatabaseId !== '(default)' && rawConfig.firestoreDatabaseId !== 'CRMFISIO')
  ? getFirestore(app, rawConfig.firestoreDatabaseId)
  : getFirestore(app);

// Firestore Collection Names
export const COLLECTIONS = {
  AGENDAMENTOS: 'agendamentos',
  PACIENTES: 'pacientes',
  EVOLUCOES: 'evolucoes',
  FINANCEIRO: 'financeiro',
  PROCEDIMENTOS: 'procedimentos',
  CONFIGURACOES: 'configuracoes',
  USUARIOS: 'usuarios_acesso',
};

// Helper to check if an email has Master privileges
export function isMasterEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return MASTER_EMAILS.some((m) => m.toLowerCase().trim() === clean);
}

// ================= AUTHENTICATION SERVICES =================
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<{ user: User | null; localFallback?: boolean }> {
  const cleanEmail = email.toLowerCase().trim();

  // Test master special auto-handler
  if (cleanEmail === TEST_MASTER_EMAIL && password === TEST_MASTER_PASSWORD) {
    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
      return { user: res.user };
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const createRes = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          return { user: createRes.user };
        } catch (createErr: any) {
          console.warn('Criação do usuário master no Firebase Auth:', createErr?.message || createErr);
        }
      }
      console.warn('Fallback local para usuário master de testes:', err?.message || err);
      return { user: auth.currentUser, localFallback: true };
    }
  }

  // Regular Firebase Email/Password login
  try {
    const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return { user: res.user };
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        const createRes = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        return { user: createRes.user };
      } catch (createErr) {
        throw err;
      }
    }
    throw err;
  }
}

export async function loginWithGoogle(): Promise<{ user: User; accessToken: string | null }> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    cachedGoogleAccessToken = credential.accessToken;
  }
  return { user: result.user, accessToken: cachedGoogleAccessToken };
}

export async function logoutUser(): Promise<void> {
  cachedGoogleAccessToken = null;
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null, token?: string | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedGoogleAccessToken = null;
    }
    callback(user, cachedGoogleAccessToken);
  });
}

// ================= ACCESS CONTROL SERVICES =================
export async function getUsuariosAcesso(): Promise<UsuarioTerapeuta[]> {
  try {
    const colRef = collection(db, COLLECTIONS.USUARIOS);
    const snap = await getDocs(colRef);
    const list: UsuarioTerapeuta[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as UsuarioTerapeuta), id: docSnap.id });
    });
    return list;
  } catch (err: any) {
    console.warn('Busca de usuários de acesso (requer autenticação):', err?.message || err);
    return [];
  }
}

export function subscribeUsuariosAcesso(callback: (usuarios: UsuarioTerapeuta[]) => void): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.USUARIOS);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: UsuarioTerapeuta[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as UsuarioTerapeuta), id: d.id });
      });
      callback(list);
    },
    (err) => {
      console.warn('Snapshot de usuários (requer autenticação CRM):', err?.message || err);
    }
  );
}

export async function saveUsuarioAcesso(usuario: UsuarioTerapeuta): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USUARIOS, usuario.id || usuario.email.replace(/[.@]/g, '_'));
    await setDoc(docRef, usuario, { merge: true });
  } catch (err: any) {
    console.error('Erro ao salvar usuário de acesso:', err);
  }
}

export async function deleteUsuarioAcesso(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USUARIOS, id);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.error('Erro ao deletar usuário de acesso:', err);
  }
}

export async function getConfigAcessos(): Promise<ConfiguracaoAcessos> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIGURACOES, 'acessos_geral');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ConfiguracaoAcessos;
    }
  } catch (e: any) {
    console.warn('Leitura de config de acessos:', e?.message || e);
  }
  return {
    chaveAcessoGeral: DEFAULT_CHAVE_ACESSO,
    masterEmail: MASTER_EMAIL,
  };
}

export async function saveConfigAcessos(cfg: ConfiguracaoAcessos): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIGURACOES, 'acessos_geral');
    await setDoc(docRef, cfg, { merge: true });
  } catch (err: any) {
    console.error('Erro ao salvar config de acessos:', err);
  }
}

// ================= DATA SYNC LISTENERS =================

export function subscribeAgendamentos(callback: (items: Agendamento[]) => void): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.AGENDAMENTOS);
  const q = query(colRef, orderBy('data', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list: Agendamento[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as Agendamento), id: d.id });
      });
      callback(list);
    },
    (err) => {
      console.warn('Snapshot de agendamentos:', err?.message || err);
    }
  );
}

export async function saveAgendamentoFirestore(ag: Agendamento): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.AGENDAMENTOS, ag.id);
    await setDoc(docRef, ag, { merge: true });
  } catch (err) {
    console.error('Erro ao salvar agendamento:', err);
  }
}

export async function deleteAgendamentoFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.AGENDAMENTOS, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Erro ao deletar agendamento:', err);
  }
}

// Pacientes
export function subscribePacientes(callback: (items: Paciente[]) => void): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.PACIENTES);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: Paciente[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as Paciente), id: d.id });
      });
      callback(list);
    },
    (err) => {
      console.warn('Snapshot de pacientes (requer autenticação CRM):', err?.message || err);
    }
  );
}

export async function savePacienteFirestore(pac: Paciente): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PACIENTES, pac.id);
    await setDoc(docRef, pac, { merge: true });
  } catch (err) {
    console.error('Erro ao salvar paciente:', err);
  }
}

export async function deletePacienteFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PACIENTES, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Erro ao deletar paciente:', err);
  }
}

// Evoluções
export function subscribeEvolucoes(callback: (items: EvolucaoClinica[]) => void): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.EVOLUCOES);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: EvolucaoClinica[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as EvolucaoClinica), id: d.id });
      });
      callback(list);
    },
    (err) => {
      console.warn('Snapshot de evoluções (requer autenticação CRM):', err?.message || err);
    }
  );
}

export async function saveEvolucaoFirestore(evo: EvolucaoClinica): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EVOLUCOES, evo.id);
    await setDoc(docRef, evo, { merge: true });
  } catch (err) {
    console.error('Erro ao salvar evolução:', err);
  }
}

export async function deleteEvolucaoFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EVOLUCOES, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Erro ao deletar evolução:', err);
  }
}

// Procedimentos
export function subscribeProcedimentos(callback: (items: Procedimento[]) => void): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.PROCEDIMENTOS);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: Procedimento[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as Procedimento), id: d.id });
      });
      callback(list);
    },
    (err) => {
      console.warn('Snapshot de procedimentos:', err?.message || err);
    }
  );
}

export async function saveProcedimentoFirestore(proc: Procedimento): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PROCEDIMENTOS, proc.id);
    await setDoc(docRef, proc, { merge: true });
  } catch (err) {
    console.error('Erro ao salvar procedimento:', err);
  }
}

export async function deleteProcedimentoFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PROCEDIMENTOS, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Erro ao deletar procedimento:', err);
  }
}

// Financeiro
export function subscribeFinanceiro(callback: (items: TransacaoFinanceira[]) => void): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.FINANCEIRO);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: TransacaoFinanceira[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as TransacaoFinanceira), id: d.id });
      });
      callback(list);
    },
    (err) => {
      console.warn('Snapshot de financeiro (requer autenticação CRM):', err?.message || err);
    }
  );
}

export async function saveFinanceiroFirestore(tx: TransacaoFinanceira): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.FINANCEIRO, tx.id);
    await setDoc(docRef, tx, { merge: true });
  } catch (err) {
    console.error('Erro ao salvar financeiro:', err);
  }
}

export async function deleteFinanceiroFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.FINANCEIRO, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Erro ao deletar financeiro:', err);
  }
}

// Configurações
export async function getClinicaFirestore(): Promise<ConfiguracaoClinica | null> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIGURACOES, 'clinica');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ConfiguracaoClinica;
    }
  } catch (e: any) {
    console.warn('Leitura de config da clínica no Firestore (usando fallback local):', e?.message || e);
  }
  return null;
}

export function subscribeClinicaFirestore(callback: (config: ConfiguracaoClinica) => void): Unsubscribe {
  const docRef = doc(db, COLLECTIONS.CONFIGURACOES, 'clinica');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as ConfiguracaoClinica);
      }
    },
    (err) => {
      console.warn('Snapshot de config da clínica:', err?.message || err);
    }
  );
}

export async function saveClinicaFirestore(config: ConfiguracaoClinica): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIGURACOES, 'clinica');
    await setDoc(docRef, config, { merge: true });
  } catch (err: any) {
    console.warn('Salvamento de config da clínica:', err?.message || err);
  }
}

export async function getInterFirestore(): Promise<ConfiguracaoInter | null> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIGURACOES, 'inter');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ConfiguracaoInter;
    }
  } catch (e: any) {
    console.warn('Leitura de config do Inter no Firestore (usando fallback local):', e?.message || e);
  }
  return null;
}

export function subscribeInterFirestore(callback: (config: ConfiguracaoInter) => void): Unsubscribe {
  const docRef = doc(db, COLLECTIONS.CONFIGURACOES, 'inter');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as ConfiguracaoInter);
      }
    },
    (err) => {
      console.warn('Snapshot de config do Inter:', err?.message || err);
    }
  );
}

export async function saveInterFirestore(config: ConfiguracaoInter): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIGURACOES, 'inter');
    await setDoc(docRef, config, { merge: true });
  } catch (err: any) {
    console.warn('Salvamento de config do Inter:', err?.message || err);
  }
}
