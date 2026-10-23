// Nounette web : congés payés d'une assistante maternelle (IDCC 3239), calculés dans le navigateur.
// Mêmes règles que l'app (Nounette/Model/Payroll.swift, paidLeave) : période du 1er juin au 31 mai,
// 2,5 jours ouvrables par 4 semaines d'accueil (30 au plus), le plus favorable du dixième et du maintien de salaire.
(function () {
  "use strict";
  const RULES = { majoredThreshold: 45, majoredRate: 0.10 };
  const eur = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
  const num = (v, d = 2) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d }).format(v);
  const val = (id) => parseFloat(String(document.getElementById(id).value).replace(",", ".")) || 0;

  function compute() {
    const rate = val("taux"), hours = val("heures"), days = val("jours"), weeks = val("semaines");
    const months = Math.min(Math.max(Math.round(val("mois")), 0), 12);
    const weekly = hours * days;
    const majored = Math.max(weekly - RULES.majoredThreshold, 0);
    const weekPay = rate * (Math.min(weekly, RULES.majoredThreshold) + majored * (1 + RULES.majoredRate));
    const monthly = weekPay * weeks / 12;
    const full = weeks >= 52;

    // Salaires de la période, hors indemnités. En année complète, la mensualisation comprend
    // déjà les congés : le dixième se calcule sur ce total, congés compris.
    const salaries = monthly * months;
    // 2,5 jours ouvrables par période de 4 semaines d'accueil programmées, 30 au plus.
    const acquired = Math.min(Math.ceil(weeks * months / 12 / 4 * 2.5), 30);
    const tenth = salaries * 0.10;
    // Maintien : ce qu'elle aurait gagné en travaillant. Une semaine de congés = 6 jours ouvrables.
    const keep = weekPay / 6 * acquired;
    const best = Math.max(tenth, keep);

    const rows = [
      ["Salaire de base mensualisé net", eur(monthly)],
      ["Jours ouvrables acquis (1er juin – 31 mai)", `${acquired} j${acquired >= 30 ? " (5 semaines)" : ""}`],
      ["Règle du dixième", `${eur(tenth)}<br><small>10 % de ${eur(salaries)} de salaires</small>`],
      ["Maintien de salaire", `${eur(keep)}<br><small>${acquired} j × ${eur(weekPay / 6)} par jour ouvrable</small>`],
    ];
    let verdict;
    if (full) {
      const complement = Math.max(tenth - keep, 0);
      rows.push(["Complément à verser fin mai", `<strong>${eur(complement)}</strong>`]);
      verdict = complement > 0.005
        ? "Année complète : les congés sont payés dans le salaire mensualisé (maintien). Le dixième étant plus élevé, la différence se verse en plus, en général avec le salaire de juin."
        : "Année complète : les congés sont déjà payés dans le salaire mensualisé, et le maintien est au moins égal au dixième. Rien à ajouter.";
    } else {
      rows.push(["Indemnité de congés payés à verser", `<strong>${eur(best)}</strong>`]);
      verdict = `Année incomplète : les congés s'ajoutent au salaire mensualisé. On retient la méthode la plus favorable, ici ${tenth >= keep ? "le dixième" : "le maintien de salaire"}. Selon le contrat, ils se versent en une fois en juin, lors du congé principal, ou au fur et à mesure des congés pris ; pas chaque mois.`;
    }

    const warn = [];
    if (weeks > 46 && weeks < 52) warn.push("Au-delà de 46 semaines d'accueil, le contrat se fait en année complète (52 semaines).");
    if (rate <= 0 || hours <= 0 || days <= 0 || months <= 0) warn.push("Renseignez le taux horaire, les heures, les jours et le nombre de mois travaillés.");

    document.getElementById("resultat").innerHTML =
      `<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</table>` +
      `<p>${verdict}</p>` +
      warn.map((w) => `<p class="alerte">${w}</p>`).join("") +
      `<p class="note">Estimation sur un salaire sans absence ni heure en plus : les heures complémentaires payées augmentent le dixième, les absences le diminuent. Jours acquis arrondis à l'entier supérieur.</p>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("calcul").addEventListener("submit", (e) => e.preventDefault());
    document.querySelectorAll("#calcul input, #calcul select").forEach((el) => el.addEventListener("input", compute));
    compute();
  });
})();
