/**
 * Publica uma ação demo no site para validar a vitrine.
 * Run: npx tsx scripts/seed-acao-publica.ts
 */
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAlOeUpyn0aadTq92pF5QflqqX90hby4Kg",
  authDomain: "g-loja.firebaseapp.com",
  projectId: "g-loja",
  storageBucket: "g-loja.firebasestorage.app",
  messagingSenderId: "9506124082",
  appId: "1:9506124082:web:159f6b98efe825c5e5672b",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const lojas = await getDocs(collection(db, "lojas"));
  if (lojas.empty) {
    console.error("Nenhuma loja no Firestore. Rode o seed da loja primeiro.");
    process.exit(1);
  }
  const loja = lojas.docs[0];
  const lojaId = loja.id;
  console.log("Loja:", loja.data().nome, lojaId);

  const existentes = await getDocs(
    query(
      collection(db, "trabalhos"),
      where("loja_id", "==", lojaId),
      where("publico", "==", true)
    )
  );

  if (!existentes.empty) {
    console.log(`Já existem ${existentes.size} ação(ões) pública(s). Nada a fazer.`);
    existentes.docs.forEach((d) => console.log(" -", d.data().titulo));
    process.exit(0);
  }

  const capa =
    "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200&q=80";

  const ref = await addDoc(collection(db, "trabalhos"), {
    loja_id: lojaId,
    titulo: "Ação solidária — doação de cestas básicas",
    descricao:
      "Irmãos da Loja reuniram-se para entregar cestas a famílias do Oriente. Esta é uma publicação de exemplo no site institucional — substitua pelas fotos e textos reais em Área do Irmão → Ações no site.",
    categoria: "ACAO",
    grau_minimo: 0,
    publico: true,
    midias: [{ url: capa, tipo: "image", nome: "acao-demo.jpg" }],
    capa_url: capa,
    criado_por: "Seed G-Loja",
    criado_em: serverTimestamp(),
  });

  console.log("✅ Ação pública criada:", ref.id);
  console.log("Abra https://g-loja.vercel.app/#acoes (após o deploy) ou localhost:3000/#acoes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
