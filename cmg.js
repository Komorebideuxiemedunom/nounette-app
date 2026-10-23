// Nounette web : CMG emploi direct d'une assistante maternelle (réforme du 1er septembre 2025), calculé dans le navigateur.
// CMG = coût plafonné × (1 − revenu mensuel × taux d'effort ÷ coût horaire de référence).
// Valeurs au 1er avril 2026 (Urssaf) ; le plancher de revenus est celui publié pour 2026.
(function () {
  "use strict";
  const CMG = {
    referenceHourly: 4.91,  // coût horaire de référence
    hourlyCap: 8.09,        // plafond horaire du coût pris en compte
    incomeFloor: 821,       // revenu mensuel retenu, au minimum
    incomeCap: 8500,        // et au maximum
    effort: [0.000619, 0.000516, 0.000413, 0.000310, 0.000310, 0.000310, 0.000310, 0.000206], // 1 à 8 enfants et plus
    taxCreditCap: 3500,     // dépenses retenues par enfant et par an
  };
  const eur = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
  const pct = (v) => new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 }).format(v);
  const val = (id) => parseFloat(String(document.getElementById(id).value).replace(",", ".")) || 0;

  function compute() {
    const rate = val("taux"), hours = val("heuresMois"), days = val("joursMois");
    const upkeep = val("entretien"), meals = val("repas"), children = Math.min(Math.max(Math.round(val("enfants")), 1), 8);
    const salary = rate * hours, cost = salary + (upkeep + meals) * days;
    const hourly = hours > 0 ? cost / hours : 0;
    const capped = Math.min(hourly, CMG.hourlyCap) * hours;
    const income = Math.min(Math.max(val("revenus") / 12, CMG.incomeFloor), CMG.incomeCap);
    const share = Math.min(income * CMG.effort[children - 1] / CMG.referenceHourly, 1);
    const aid = capped * (1 - share);
    const rest = cost - aid;
    // Crédit d'impôt : 50 % des frais de garde moins les aides, repas exclus, 3 500 € par enfant et par an au plus.
    const taxBase = Math.min(Math.max((salary + upkeep * days - aid) * 12, 0), CMG.taxCreditCap);
    const credit = taxBase * 0.5;

    const rows = [
      ["Coût de la garde par mois", `${eur(cost)}<br><small>salaire ${eur(salary)}, indemnités ${eur((upkeep + meals) * days)}</small>`],
      ["Revenu mensuel retenu", eur(income)],
      ["Part à votre charge", pct(share)],
      ["CMG par mois (environ)", `<strong>${eur(aid)}</strong>`],
      ["Cotisations sociales", "Prises en charge par la Caf, sous le plafond horaire"],
      ["Reste à payer par mois", `<strong>${eur(rest)}</strong>`],
      ["Crédit d'impôt (environ)", `${eur(credit)} par an<br><small>soit ${eur(rest - credit / 12)} par mois après crédit</small>`],
    ];
    const warn = [];
    if (hourly > CMG.hourlyCap) warn.push(`Le coût revient à ${eur(hourly)} de l'heure, au-dessus du plafond de ${eur(CMG.hourlyCap)} : la part au-dessus et ses cotisations restent à votre charge, mais le CMG reste versé.`);
    if (share >= 1) warn.push("Avec ces revenus et ce nombre d'enfants, le calcul ne laisse pas de CMG : seules les cotisations sont prises en charge. Il reste le crédit d'impôt.");
    if (rate <= 0 || hours <= 0) warn.push("Renseignez le taux horaire et les heures du mois.");

    document.getElementById("resultat").innerHTML =
      `<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</table>` +
      warn.map((w) => `<p class="alerte">${w}</p>`).join("") +
      `<p class="note">CMG = coût plafonné à ${eur(CMG.hourlyCap)} de l'heure × (1 − revenu mensuel × taux d'effort ÷ ${eur(CMG.referenceHourly)}). Revenu retenu : vos revenus nets catégoriels de l'avant-dernière année ÷ 12, entre ${eur(CMG.incomeFloor)} et ${eur(CMG.incomeCap)}. Estimation : la Caf calcule le montant exact chaque mois à partir de la déclaration Pajemploi.</p>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("calcul").addEventListener("submit", (e) => e.preventDefault());
    document.querySelectorAll("#calcul input, #calcul select").forEach((el) => el.addEventListener("input", compute));
    compute();
  });
})();
