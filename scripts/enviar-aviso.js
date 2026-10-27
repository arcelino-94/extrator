// Envia o aviso diário de contas para todos os celulares inscritos.
// Roda no GitHub Actions (seg a sex às 9h de Recife).
const webpush = require('web-push');

const URL_APP = process.env.APPS_SCRIPT_URL;
const SEGREDO = process.env.SHARED_SECRET;
const FORCAR = process.env.FORCAR || '';

async function getJson(params) {
  const query = new URLSearchParams({ secret: SEGREDO, ...params });
  const r = await fetch(URL_APP + '?' + query.toString(), { redirect: 'follow' });
  const texto = await r.text();
  try {
    return JSON.parse(texto);
  } catch (e) {
    throw new Error('Resposta inesperada do servidor: ' + texto.slice(0, 120));
  }
}

(async () => {
  webpush.setVapidDetails('mailto:contas@example.com', process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

  const resumo = await getJson({ action: 'resumoAviso', forcar: FORCAR });
  if (resumo.error) throw new Error(resumo.error);
  if (resumo.ignorar) {
    console.log('Fim de semana: nenhum aviso enviado.');
    return;
  }

  const { inscricoes = [] } = await getJson({ action: 'listarPush' });
  if (inscricoes.length === 0) {
    console.log('Nenhum celular inscrito ainda.');
    return;
  }

  const payload = JSON.stringify({ title: resumo.titulo, body: resumo.corpo });
  let enviados = 0;
  for (const sub of inscricoes) {
    try {
      await webpush.sendNotification(sub, payload, { TTL: 3600 });
      enviados++;
    } catch (e) {
      console.log('Falha no envio (status ' + e.statusCode + ')');
      if (e.statusCode === 404 || e.statusCode === 410) {
        await getJson({ action: 'removerPush', endpoint: sub.endpoint });
        console.log('Inscrição expirada removida.');
      }
    }
  }
  console.log('Enviados: ' + enviados + ' de ' + inscricoes.length);
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
