import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { getLojaId } from "@/lib/auth-store";

const CLEANUP_KEY = "gloja-last-cleanup";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_YEAR_AGO = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
};

export async function cleanupOldData(): Promise<void> {
  if (typeof window === "undefined") return;

  const last = localStorage.getItem(CLEANUP_KEY);
  if (last && Date.now() - Number(last) < ONE_DAY_MS) return;

  const lojaId = getLojaId();
  if (!lojaId) return;

  localStorage.setItem(CLEANUP_KEY, String(Date.now()));

  const cutoff = ONE_YEAR_AGO();

  try {
    const sessoesSnap = await getDocs(
      query(collection(db, "sessoes"), where("loja_id", "==", lojaId))
    );
    const oldSessoes = sessoesSnap.docs.filter((d) => (d.data().data ?? "") < cutoff);

    for (const sessao of oldSessoes) {
      const presencasSnap = await getDocs(
        query(collection(db, "presencas"), where("sessao_id", "==", sessao.id))
      );
      const batch = writeBatch(db);
      presencasSnap.docs.forEach((p) => batch.delete(p.ref));
      batch.delete(sessao.ref);
      await batch.commit();
    }

    const txSnap = await getDocs(
      query(collection(db, "transacoes"), where("loja_id", "==", lojaId))
    );
    const oldTx = txSnap.docs.filter((d) => (d.data().vencimento ?? "") < cutoff);

    for (const tx of oldTx) {
      const anexosSnap = await getDocs(
        query(collection(db, "anexos"), where("transacao_id", "==", tx.id))
      );
      const batch = writeBatch(db);
      anexosSnap.docs.forEach((a) => batch.delete(a.ref));
      batch.delete(tx.ref);
      await batch.commit();
    }

    const total = oldSessoes.length + oldTx.length;
    if (total > 0) {
      console.log(`[G-Loja] Limpeza: ${oldSessoes.length} sessões e ${oldTx.length} transações com mais de 1 ano removidas.`);
    }
  } catch (err) {
    console.warn("[G-Loja] Limpeza automática falhou:", err);
  }
}
