// Nounette web : fin de contrat d'une assistante maternelle (retrait de l'enfant), IDCC 3239.
// Préavis (art. 120) : 8 jours avant 3 mois d'ancienneté, 15 jours avant 1 an, 1 mois ensuite.
// Indemnité de rupture (art. 121.1) : 1/80 des salaires bruts du contrat, dès 9 mois d'ancienneté.
(function () {
  "use strict";
  // Part salariale des cotisations d'une assistante maternelle, pour passer du net au brut
  // quand le parent n'a que le net : une estimation, les bulletins Pajemploi donnent le vrai brut.
  const NET_TO_GROSS = 1 / 0.78;
  const eur = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
  const val = (id) => parseFloat(String(document.getElementById(id).value).replace(",", ".")) || 0;
  const date = (id) => { const d = new Date(document.getElementById(id).value); return isNaN(d) ? null : d; };

  function monthsBetween(a, b) {
    let m = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
    if (b.getDate() < a.getDate()) m -= 1;
    return Math.max(m, 0);
  }

  function compute() {
    const start = date("debut"), letter = date("lettre");
    const net = val("net");
    const exactGross = val("brut");
    const out = document.getElementById("resultat");
    if (!start || !letter || letter < start) {
      out.innerHTML = `<p class="alerte">Renseignez la date de début du contrat et la date d'envoi de la lettre (après le début).</p>`;
      return;
    }
    const months = monthsBetween(start, letter);
    const years = Math.floor(months / 12);
    const seniority = years ? `${years} an${years > 1 ? "s" : ""}${months % 12 ? ` et ${months % 12} mois` : ""}` : `${months} mois`;
    const notice = months < 3 ? { label: "8 jours calendaires", months: 8 / 30 }
      : months < 12 ? { label: "15 jours calendaires", months: 0.5 }
      : { label: "1 mois calendaire", months: 1 };
    const noticePay = net * notice.months;

    // Base de l'indemnité : salaires bruts du contrat, préavis compris, hors entretien, repas et km.
    const gross = exactGross > 0 ? exactGross + noticePay * NET_TO_GROSS : (months + notice.months) * net * NET_TO_GROSS;
    const eligible = months >= 9;
    const severance = eligible ? gross / 80 : 0;

    const rows = [
      ["Ancienneté à l'envoi de la lettre", seniority],
      ["Préavis", `${notice.label}<br><small>payé environ ${eur(noticePay)} net, travaillé ou non si le parent en dispense</small>`],
      ["Salaires bruts du contrat, préavis compris", `${exactGross > 0 ? "" : "environ "}${eur(gross)}`],
      ["Indemnité de rupture (1/80)", eligible ? `<strong>${eur(severance)}</strong><br><small>sans cotisations ni impôt</small>` : "<strong>0 €</strong><br><small>moins de 9 mois d'ancienneté</small>"],
    ];

    const warn = [];
    if (net <= 0 && exactGross <= 0) warn.push("Renseignez le salaire mensualisé net, ou le total brut exact de vos bulletins Pajemploi.");
    if (!eligible && months >= 8) warn.push("L'ancienneté se compte au jour d'envoi de la lettre : à quelques semaines près, l'indemnité devient due.");

    out.innerHTML =
      `<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</table>` +
      warn.map((w) => `<p class="alerte">${w}</p>`).join("") +
      `<p>À verser aussi : les congés payés acquis et non pris, et en année incomplète la régularisation si l'assistante a fait plus d'heures que celles payées. L'indemnité n'est pas due en cas de démission, de faute grave ou de retrait de l'agrément.</p>` +
      `<p class="note">${exactGross > 0 ? "Base : le total brut saisi, plus le préavis." : "Base estimée : salaire net × mois d'ancienneté, ramené au brut (cotisations salariales d'environ 22 %). Le total brut exact de vos bulletins Pajemploi donne le montant juste."}</p>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("calcul").addEventListener("submit", (e) => e.preventDefault());
    const today = new Date().toISOString().slice(0, 10);
    const letter = document.getElementById("lettre");
    if (!letter.value) letter.value = today;
    document.querySelectorAll("#calcul input, #calcul select").forEach((el) => el.addEventListener("input", compute));
    compute();
  });
})();
