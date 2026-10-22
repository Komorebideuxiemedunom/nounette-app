// Nounette web : salaire mensualisé d'une assistante maternelle, calculé dans le navigateur.
// Mêmes règles et mêmes valeurs datées que l'app (Nounette/Model/Contract.swift, Payroll.swift) :
// à mettre à jour ensemble à chaque revalorisation.
(function () {
  "use strict";
  const RULES = { minimumGaranti: 4.35, maintenanceFloor: 2.65, majoredThreshold: 45, majoredRate: 0.10, date: "1er juin 2026" };
  const eur = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
  const num = (v, d = 2) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d }).format(v);
  const val = (id) => parseFloat(String(document.getElementById(id).value).replace(",", ".")) || 0;

  const minimumMaintenance = (hours) => Math.max(RULES.maintenanceFloor, RULES.minimumGaranti * 0.9 * hours / 9);

  function compute() {
    const rate = val("taux"), hours = val("heures"), days = val("jours"), weeks = val("semaines");
    const meal = val("repas");
    const weekly = hours * days;
    const normal = Math.min(weekly, RULES.majoredThreshold);
    const majored = Math.max(weekly - RULES.majoredThreshold, 0);
    const base = rate * (normal + majored * (1 + RULES.majoredRate)) * weeks / 12;
    const monthlyHours = weekly * weeks / 12;
    const monthlyDays = days * weeks / 12;
    const minMaint = minimumMaintenance(hours);
    const maintField = document.getElementById("entretien");
    if (!maintField.dataset.touched) maintField.value = minMaint.toFixed(2).replace(".", ",");
    const maint = val("entretien");
    const full = weeks >= 52;
    const leave = full ? 0 : base * 12 * 0.10;
    const perMonthAllowances = (maint + meal) * monthlyDays;

    const rows = [
      ["Heures d'accueil par semaine", `${num(weekly)} h${majored ? ` (dont ${num(majored)} h majorées de 10 %)` : ""}`],
      ["Type de contrat", full ? "Année complète (52 semaines, congés payés compris dans le salaire)" : `Année incomplète (${num(weeks, 0)} semaines d'accueil)`],
      ["Salaire de base mensualisé net", `<strong>${eur(base)}</strong>`],
      ["Heures normales à déclarer (Pajemploi)", `${Math.round(monthlyHours)} h`],
      ["Jours d'activité à déclarer (Pajemploi)", `${Math.ceil(monthlyDays)} j`],
      ["Indemnité d'entretien minimale", `${eur(minMaint)} par jour d'accueil de ${num(hours)} h`],
      ["Indemnités d'un mois moyen", `environ ${eur(perMonthAllowances)} (entretien${meal ? " et repas" : ""})`],
    ];
    if (!full) rows.push(["Congés payés (règle du dixième)", `environ ${eur(leave)} par an, versés en plus du salaire`]);
    rows.push(["Total moyen versé par mois", `<strong>${eur(base + perMonthAllowances)}</strong>${full ? "" : " hors congés payés"}`]);

    const warn = [];
    if (maint + 0.004 < minMaint) warn.push(`L'indemnité d'entretien saisie est sous le minimum de la convention (${eur(minMaint)} pour ${num(hours)} h).`);
    if (weeks > 46 && weeks < 52) warn.push("Au-delà de 46 semaines d'accueil, le contrat se fait en année complète (52 semaines).");
    if (rate <= 0 || hours <= 0 || days <= 0) warn.push("Renseignez le taux horaire, les heures par jour et les jours par semaine.");

    document.getElementById("resultat").innerHTML =
      `<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</table>` +
      warn.map((w) => `<p class="alerte">${w}</p>`).join("") +
      `<p class="note">Calcul : taux horaire × heures par semaine × semaines ÷ 12, selon la convention collective IDCC 3239. Valeurs légales au ${RULES.date}. Estimation hors absences, heures en plus et premier mois incomplet.</p>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("calcul").addEventListener("submit", (e) => e.preventDefault());
    document.getElementById("entretien").addEventListener("input", (e) => (e.target.dataset.touched = "1"));
    document.querySelectorAll("#calcul input, #calcul select").forEach((el) => el.addEventListener("input", compute));
    compute();
  });
})();
