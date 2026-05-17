// Run: npx tsx scripts/seed-firestore.ts
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

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

async function seed() {
  console.log("Criando loja demo...");
  const lojaRef = await addDoc(collection(db, "lojas"), {
    cnpj: "00.000.000/0001-00",
    senha: "gloja2026",
    nome: "Loja Estrela do Oriente nº 001",
    oriente: "Oriente de São Paulo — GOB",
    nome_admin: "Ven.·. Mestre",
    primeiro_acesso: true,
    criado_em: serverTimestamp(),
  });
  console.log("Loja criada:", lojaRef.id);

  const irmaos = [
    { nome: "José Carlos Almeida", cim: "12.345", cpf: "123.456.789-01", email: "jose.almeida@email.com", telefone: "(11) 98765-4321", grau: "MESTRE", cargo: "VENERAVEL", status: "ATIVO", data_nasc: "1975-03-12", data_iniciacao: "2001-08-15" },
    { nome: "Ricardo Henrique Souza", cim: "12.346", cpf: "234.567.890-12", email: "ricardo.souza@email.com", telefone: "(21) 97654-3210", grau: "COMPANHEIRO", cargo: "PRIMEIRO_VIGILANTE", status: "ATIVO", data_nasc: "1982-07-22", data_iniciacao: "2010-11-20" },
    { nome: "Marcos Paulo Lima", cim: "12.347", cpf: "345.678.901-23", email: "marcos.lima@email.com", telefone: "(31) 96543-2109", grau: "MESTRE", cargo: "SEGUNDO_VIGILANTE", status: "ATIVO", data_nasc: "1978-11-05", data_iniciacao: "2005-03-10" },
    { nome: "Fernando Antônio Costa", cim: "12.348", cpf: "456.789.012-34", email: "fernando.costa@email.com", telefone: "(41) 95432-1098", grau: "MESTRE", cargo: "TESOUREIRO", status: "ATIVO", data_nasc: "1980-01-17", data_iniciacao: "2008-06-25" },
    { nome: "Paulo Roberto Mendes", cim: "12.349", cpf: "567.890.123-45", email: "paulo.mendes@email.com", telefone: "(51) 94321-0987", grau: "APRENDIZ", cargo: "CHANCELER", status: "ATIVO", data_nasc: "1990-09-30", data_iniciacao: "2020-02-14" },
    { nome: "Antônio Carlos Ferreira", cim: "12.350", cpf: "678.901.234-56", email: "antonio.ferreira@email.com", telefone: "(61) 93210-9876", grau: "MESTRE", cargo: "SECRETARIO", status: "ATIVO", data_nasc: "1972-05-08", data_iniciacao: "1999-12-01" },
    { nome: "Luiz Eduardo Santos", cim: "12.351", cpf: "789.012.345-67", email: "luiz.santos@email.com", telefone: "(71) 92109-8765", grau: "MESTRE", cargo: "ORADOR", status: "ATIVO", data_nasc: "1985-12-25", data_iniciacao: "2012-07-18" },
  ];

  console.log("Criando irmãos...");
  for (const irmao of irmaos) {
    await addDoc(collection(db, "irmaos"), {
      loja_id: lojaRef.id,
      ...irmao,
      criado_em: serverTimestamp(),
    });
  }
  console.log(`${irmaos.length} irmãos criados.`);

  console.log("\n✅ Seed concluído!");
  console.log("Login: CNPJ 00.000.000/0001-00 | Senha: gloja2026");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
