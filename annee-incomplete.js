// Nounette web : mensualisation en année incomplète, à partir des semaines sans accueil.
// Même formule que calcul.js (taux × heures par semaine × semaines ÷ 12), mêmes valeurs.
(function () {
  "use strict";
  const RULES = { majoredThreshold: 45, majoredRate: 0.10 };
  const eur = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
  const num = (v, d = 2) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d }).format(v);
  const val = (id) => parseFloat(String(document.getElementById(id).value).replace(",", ".")) || 0;

  function compute() {
    const rate = val("taux"), hours = val("heures"), days = val("jours");
    const family = Math.max(Math.round(val("absFamille")), 0);
    const nanny = Math.max(Math.round(val("absAssmat")), 0);
    const overlap = Math.max(Math.round(val("communes")), 0);
    // Une semaine où les deux sont absents ne se retire qu'une fois.
    const off = Math.max(family + nanny - Math.min(overlap, family, nanny), 0);
    const weeks = Math.max(52 - off, 0);
    const weekly = hours * days;
    const majored = Math.max(weekly - RULES.majoredThreshold, 0);
    const weekPay = rate * (Math.min(weekly, RULES.majoredThreshold) + majored * (1 + RULES.majoredRate));
    const full = weeks > 46;
    const monthly = weekPay * (full ? 52 : weeks) / 12;
    // Congés payés : le plus favorable du dixième et du maintien (même calcul que conges.js).
    const acquired = Math.min(Math.ceil(weeks / 4 * 2.5), 30);
    const leave = Math.max(monthly * 12 * 0.10, weekPay / 6 * acquired);
    const fullYear = weekPay * 52 / 12;

    const rows = [
      ["Semaines sans accueil", `${off} (famille ${family}, assistante ${nanny}${overlap ? `, dont ${Math.min(overlap, family, nanny)} en commun` : ""})`],
      ["Semaines d'accueil programmées", `${weeks}`],
      ["Type de contrat", full ? "Année complète (52 semaines)" : "Année incomplète"],
      ["Salaire mensualisé net", `<strong>${eur(monthly)}</strong>`],
      ["Heures mensualisées (Pajemploi)", `${Math.round(weekly * (full ? 52 : weeks) / 12)} h`],
      ["Jours d'activité par mois (Pajemploi)", `${Math.ceil(days * (full ? 52 : weeks) / 12)} j`],
    ];
    if (!full) {
      rows.push(["Congés payés en plus (environ)", `${eur(leave)} par an<br><small>${acquired} jours ouvrables acquis</small>`]);
      rows.push(["Coût annuel des salaires", `${eur(monthly * 12 + leave)}<br><small>contre ${eur(fullYear * 12)} en année complète</small>`]);
    }

    const warn = [];
    if (full && off > 0) warn.push(`Avec ${weeks} semaines d'accueil, plus de 46 : le contrat se fait en année complète, sur 52 semaines, congés compris.`);
    if (nanny > 6) warn.push("Une assistante maternelle prend au plus 5 semaines de congés payés, plus parfois une 6e sans solde : vérifiez le nombre saisi.");
    if (rate <= 0 || hours <= 0 || days <= 0) warn.push("Renseignez le taux horaire, les heures par jour et les jours par semaine.");

    document.getElementById("resultat").innerHTML =
      `<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</table>` +
      warn.map((w) => `<p class="alerte">${w}</p>`).join("") +
      `<p class="note">Calcul : taux horaire × ${num(weekly)} h par semaine × ${full ? 52 : weeks} semaines ÷ 12, convention collective IDCC 3239. Heures au-delà de 45 h par semaine majorées de 10 %.</p>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("calcul").addEventListener("submit", (e) => e.preventDefault());
    document.querySelectorAll("#calcul input, #calcul select").forEach((el) => el.addEventListener("input", compute));
    compute();
  });
})();
