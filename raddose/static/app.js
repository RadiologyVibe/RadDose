'use strict';

// ─── Data ───────────────────────────────────────────────────────────────────
// Effective doses in mSv (approximate, based on NRPB, ICRP 103, ACR, AAPM data)
const EXAMS = [
  // Chest
  { id: 'cxr_pa', name: 'Chest X-ray (PA)', category: 'Chest', modality: 'XR', dose: 0.02, organDose: { lung: 0.02, breast: 0.003 }, fetal: 0.00001, description: 'Standard PA chest radiograph. The most commonly performed imaging study worldwide.' },
  { id: 'cxr_ap', name: 'Chest X-ray (AP/portable)', category: 'Chest', modality: 'XR', dose: 0.02, organDose: { lung: 0.02 }, fetal: 0.00001, description: 'AP portable chest, slightly higher dose due to geometry.' },
  { id: 'ct_chest', name: 'CT Chest (non-contrast)', category: 'Chest', modality: 'CT', dose: 7, organDose: { lung: 12, breast: 5 }, fetal: 0.02, description: 'Full chest CT. Used for lung cancer staging, interstitial lung disease, trauma.' },
  { id: 'ct_chest_ce', name: 'CT Chest (with contrast)', category: 'Chest', modality: 'CT', dose: 8, organDose: { lung: 13, breast: 6 }, fetal: 0.03, description: 'Contrast-enhanced chest CT for pulmonary vasculature, lymphoma staging, infection.' },
  { id: 'ct_pa', name: 'CT Pulmonary Angiogram (CTPA)', category: 'Chest', modality: 'CT', dose: 10, organDose: { lung: 14, breast: 12 }, fetal: 0.03, description: 'CT angiogram for pulmonary embolism. Higher breast dose due to bolus tracking.' },
  { id: 'hrct', name: 'HRCT Chest (ILD protocol)', category: 'Chest', modality: 'CT', dose: 3, organDose: { lung: 5 }, fetal: 0.01, description: 'High-resolution CT for interstitial lung disease. Often uses volumetric thin-section acquisition.' },
  { id: 'ldct_lung', name: 'Low-dose CT (lung cancer screen)', category: 'Chest', modality: 'CT', dose: 1.5, organDose: { lung: 3 }, fetal: 0.005, description: 'LDCT for lung cancer screening (NELSON, NLST protocols). ~75% dose reduction vs standard CT.' },

  // Abdomen
  { id: 'kub', name: 'KUB / Abdominal X-ray', category: 'Abdomen', modality: 'XR', dose: 0.7, organDose: { gonad: 0.1, stomach: 0.5 }, fetal: 0.5, description: 'Plain abdominal radiograph. Limited soft tissue contrast but useful for obstruction, calculi.' },
  { id: 'ct_abdo', name: 'CT Abdomen (portal venous phase)', category: 'Abdomen', modality: 'CT', dose: 8, organDose: { stomach: 10, liver: 12, gonad: 0.5 }, fetal: 24, description: 'Standard CT abdomen with IV contrast. Most common CT examination in emergency.' },
  { id: 'ct_abdo_pelvis', name: 'CT Abdomen & Pelvis', category: 'Abdomen', modality: 'CT', dose: 15, organDose: { stomach: 12, gonad: 8, bladder: 15 }, fetal: 25, description: 'Combined abdominal and pelvic CT. Very common in trauma and oncology.' },
  { id: 'ct_triple', name: 'CT Chest/Abdomen/Pelvis (staging)', category: 'Abdomen', modality: 'CT', dose: 20, organDose: { lung: 12, stomach: 12, gonad: 8 }, fetal: 25, description: 'Full staging CT for cancer follow-up or lymphoma staging.' },
  { id: 'ct_colonography', name: 'CT Colonography (CTC)', category: 'Abdomen', modality: 'CT', dose: 6, organDose: { colon: 10, gonad: 3 }, fetal: 15, description: 'Virtual colonoscopy using supine + prone low-dose CT.' },
  { id: 'ct_pancreas', name: 'CT Pancreas (triphasic)', category: 'Abdomen', modality: 'CT', dose: 20, organDose: { pancreas: 15 }, fetal: 24, description: 'Dedicated pancreatic protocol CT with pancreatic parenchymal, portal venous phases.' },
  { id: 'ct_liver', name: 'CT Liver (multiphasic)', category: 'Abdomen', modality: 'CT', dose: 18, organDose: { liver: 20 }, fetal: 24, description: 'Multiphasic liver CT for HCC characterisation (pre-contrast, arterial, portal, delayed).' },
  { id: 'barium_swallow', name: 'Barium Swallow', category: 'Abdomen', modality: 'Fluoro', dose: 1.5, organDose: { oesophagus: 5 }, fetal: 0.002, description: 'Fluoroscopic examination of the oesophagus and upper GI tract.' },
  { id: 'barium_enema', name: 'Barium Enema', category: 'Abdomen', modality: 'Fluoro', dose: 8, organDose: { colon: 15, gonad: 4 }, fetal: 6.5, description: 'Fluoroscopic colon examination. Largely replaced by CT colonography.' },

  // Pelvis & GU
  { id: 'pelvic_xr', name: 'Pelvis X-ray', category: 'Pelvis', modality: 'XR', dose: 0.7, organDose: { gonad: 0.2, bladder: 0.5 }, fetal: 0.5, description: 'AP pelvis radiograph. Used for trauma, hip pathology, pre-surgical planning.' },
  { id: 'ct_pelvis', name: 'CT Pelvis', category: 'Pelvis', modality: 'CT', dose: 10, organDose: { bladder: 20, gonad: 8 }, fetal: 25, description: 'CT of the pelvis for trauma, oncology, abscess, vascular pathology.' },
  { id: 'ct_kub', name: 'CT Urogram (3-phase)', category: 'Pelvis', modality: 'CT', dose: 25, organDose: { kidney: 30, bladder: 20 }, fetal: 25, description: 'Three-phase CT for urinary tract evaluation. High gonadal and fetal dose.' },
  { id: 'ct_renal_stone', name: 'CT KUB (renal stone, low dose)', category: 'Pelvis', modality: 'CT', dose: 3, organDose: { kidney: 5 }, fetal: 10, description: 'Low-dose non-contrast CT for renal colic. Dose can be as low as 1.5 mSv with LDCT protocols.' },
  { id: 'vcug', name: 'VCUG (voiding cystourethrogram)', category: 'Pelvis', modality: 'Fluoro', dose: 1, organDose: { bladder: 4, gonad: 0.5 }, fetal: 1, description: 'Fluoroscopic examination for vesicoureteral reflux assessment (mainly paediatric).' },

  // Head & Neck
  { id: 'skull_xr', name: 'Skull X-ray', category: 'Head', modality: 'XR', dose: 0.06, organDose: { brain: 0.05 }, fetal: 0.000001, description: 'Plain skull radiograph. Largely superseded by CT for head trauma.' },
  { id: 'ct_head', name: 'CT Head (non-contrast)', category: 'Head', modality: 'CT', dose: 2, organDose: { brain: 50 }, fetal: 0.001, description: 'Non-contrast CT head for trauma, stroke (haemorrhage), headache. Very low fetal dose.' },
  { id: 'ct_head_ce', name: 'CT Head (with contrast)', category: 'Head', modality: 'CT', dose: 3, organDose: { brain: 55 }, fetal: 0.001, description: 'Contrast CT head for tumour, abscess, meningeal pathology.' },
  { id: 'cta_brain', name: 'CT Angiogram Brain', category: 'Head', modality: 'CT', dose: 2, organDose: { brain: 30 }, fetal: 0.001, description: 'CTA for intracranial aneurysm, AVM, and occlusive disease.' },
  { id: 'ct_neck', name: 'CT Neck (soft tissue)', category: 'Head', modality: 'CT', dose: 3, organDose: { thyroid: 30 }, fetal: 0.001, description: 'CT soft tissue neck for abscess, mass, lymphadenopathy. Note high thyroid dose.' },

  // Spine
  { id: 'c_spine_xr', name: 'Cervical Spine X-ray', category: 'Spine', modality: 'XR', dose: 0.07, organDose: { thyroid: 2 }, fetal: 0.00001, description: 'Plain cervical spine radiograph (AP, lateral, peg view).' },
  { id: 'l_spine_xr', name: 'Lumbar Spine X-ray', category: 'Spine', modality: 'XR', dose: 1.5, organDose: { gonad: 0.5, colon: 2 }, fetal: 1.3, description: 'AP and lateral lumbar spine. Significant gonadal dose — shield where possible.' },
  { id: 'ct_c_spine', name: 'CT Cervical Spine', category: 'Spine', modality: 'CT', dose: 3, organDose: { thyroid: 25 }, fetal: 0.001, description: 'CT cervical spine for trauma, fracture characterisation.' },
  { id: 'ct_l_spine', name: 'CT Lumbar Spine', category: 'Spine', modality: 'CT', dose: 6, organDose: { colon: 10, gonad: 3 }, fetal: 6, description: 'CT lumbar spine for fracture, post-surgical hardware evaluation.' },

  // MSK
  { id: 'hand_xr', name: 'Hand X-ray (2 views)', category: 'MSK', modality: 'XR', dose: 0.001, organDose: {}, fetal: 0.000001, description: 'Extremely low dose. Virtually no radiation risk.' },
  { id: 'extremity_xr', name: 'Extremity X-ray (arm/leg)', category: 'MSK', modality: 'XR', dose: 0.01, organDose: {}, fetal: 0.000001, description: 'Plain radiograph of limb. Negligible gonadal and fetal dose.' },
  { id: 'hip_xr', name: 'Hip X-ray', category: 'MSK', modality: 'XR', dose: 0.7, organDose: { gonad: 0.1 }, fetal: 0.3, description: 'AP hip. Higher dose than extremity due to proximity to gonads and femoral vessels.' },
  { id: 'mammogram', name: 'Mammogram (bilateral)', category: 'Chest', modality: 'XR', dose: 0.4, organDose: { breast: 3 }, fetal: 0.00001, description: 'Bilateral 2-view mammogram. Breast glandular dose is the relevant metric (not effective dose).' },
  { id: 'dxa', name: 'DXA Bone Density Scan', category: 'MSK', modality: 'XR', dose: 0.001, organDose: {}, fetal: 0.001, description: 'Dual-energy X-ray absorptiometry for bone density. Extremely low dose.' },

  // Nuclear Medicine
  { id: 'vq_scan', name: 'V/Q Scan (ventilation/perfusion)', category: 'Nuclear', modality: 'NM', dose: 2, organDose: { lung: 5 }, fetal: 0.6, description: 'Nuclear medicine lung scan for PE. Lower dose than CTPA; preferred in young women and pregnancy (second trimester).' },
  { id: 'bone_scan', name: 'Tc-99m Bone Scan', category: 'Nuclear', modality: 'NM', dose: 4, organDose: { bone: 18, bladder: 45 }, fetal: 4.4, description: 'Three-phase bone scintigraphy for metastases, infection, fracture.' },
  { id: 'pet_ct', name: 'PET-CT (FDG whole body)', category: 'Nuclear', modality: 'NM', dose: 25, organDose: { brain: 14, bladder: 70 }, fetal: 16, description: 'Combined PET-CT with FDG for oncological staging. High bladder dose — encourage hydration and frequent voiding.' },
  { id: 'renal_scan', name: 'Tc-99m MAG3 Renal Scan', category: 'Nuclear', modality: 'NM', dose: 1, organDose: { kidney: 5 }, fetal: 0.8, description: 'Diuretic renography for obstruction and differential renal function.' },
];

// Organ dose factor for pregnancy (mGy fetal per mSv effective dose — approximate)
// Fetal dose already included per exam above (in mGy)

const COMPARISONS = [
  { label: 'Background radiation (UK, 1 day)', dose: 0.008, icon: '🌍' },
  { label: 'Background radiation (UK, 1 year)', dose: 2.7, icon: '🌍' },
  { label: 'Transatlantic flight (London→New York)', dose: 0.06, icon: '✈️' },
  { label: 'Dental X-ray (bitewing)', dose: 0.005, icon: '🦷' },
  { label: 'Mammogram', dose: 0.4, icon: '🔬' },
  { label: 'Smoking 1 pack/day for 1 year (radon)', dose: 13, icon: '🚬' },
  { label: 'Living in Denver (extra cosmic, 1 year)', dose: 0.5, icon: '🏔️' },
  { label: 'Annual radiation worker limit', dose: 20, icon: '⚗️' },
  { label: 'Annual radiation worker limit (US, 50 mSv)', dose: 50, icon: '⚗️' },
  { label: 'Hiroshima survivors — threshold for ARS', dose: 1000, icon: '⚠️' },
];

// ─── State ──────────────────────────────────────────────────────────────────
let currentCategory = 'All';
let selectedExam = null;
let rocChart = null;

document.addEventListener('DOMContentLoaded', () => {
  populateCategoryBtns();
  renderExamList();
  populateCompareSelects();
  populatePregExam();
  populatePatientExam();
});

// ─── Tab Navigation ──────────────────────────────────────────────────────────
function showTab(id, btn) {
  document.querySelectorAll('[id^="tab-"]').forEach(t => t.classList.add('d-none'));
  document.getElementById('tab-' + id).classList.remove('d-none');
  document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ─── Dose Lookup ─────────────────────────────────────────────────────────────
function populateCategoryBtns() {
  const cats = ['All', ...new Set(EXAMS.map(e => e.category))];
  document.getElementById('categoryBtns').innerHTML = cats.map(c =>
    `<button class="category-btn ${c === 'All' ? 'active' : ''}" onclick="filterCategory('${c}', this)">${c}</button>`
  ).join('');
}

function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderExamList();
}

function filterExams() {
  renderExamList();
}

function renderExamList() {
  const q = document.getElementById('examSearch')?.value.toLowerCase() || '';
  const exams = EXAMS.filter(e =>
    (currentCategory === 'All' || e.category === currentCategory) &&
    (!q || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
  );

  const maxDose = 25;
  document.getElementById('examList').innerHTML = exams.map(e => {
    const riskClass = e.dose < 0.1 ? 'risk-negligible' : e.dose < 5 ? 'risk-low' : e.dose < 15 ? 'risk-moderate' : 'risk-high';
    const riskLabel = e.dose < 0.1 ? 'Negligible' : e.dose < 5 ? 'Low' : e.dose < 15 ? 'Moderate' : 'High';
    const barWidth = Math.min(100, (e.dose / maxDose) * 100);
    const barColor = e.dose < 0.1 ? '#22c55e' : e.dose < 5 ? '#eab308' : e.dose < 15 ? '#f97316' : '#e63757';

    return `<div class="dose-row ${selectedExam?.id === e.id ? 'selected' : ''}" onclick="selectExam('${e.id}')">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <span style="font-size:0.88rem;font-weight:500">${e.name}</span>
        <div class="d-flex align-items-center gap-2">
          <span class="risk-badge ${riskClass}">${riskLabel}</span>
          <span class="fw-bold" style="font-size:0.88rem;color:${barColor};min-width:60px;text-align:right">${formatDose(e.dose)} mSv</span>
        </div>
      </div>
      <div class="dose-bar-wrap">
        <div class="dose-bar" style="width:${barWidth}%;background:${barColor}"></div>
      </div>
    </div>`;
  }).join('');
}

function formatDose(d) {
  if (d < 0.01) return d.toFixed(4);
  if (d < 0.1) return d.toFixed(3);
  if (d < 10) return d.toFixed(1);
  return d.toFixed(0);
}

function selectExam(id) {
  selectedExam = EXAMS.find(e => e.id === id);
  renderExamList();
  renderExamDetail();
  updateMeter();
}

function updateMeter() {
  if (!selectedExam) return;
  const maxDose = 25;
  const pct = Math.min(98, (selectedExam.dose / maxDose) * 100);
  document.getElementById('meterPointer').style.left = `${pct}%`;
}

function renderExamDetail() {
  if (!selectedExam) return;
  const e = selectedExam;
  const equivalents = COMPARISONS.map(c => {
    const ratio = e.dose / c.dose;
    return { ...c, ratio };
  }).filter(c => c.ratio > 0.01 && c.ratio < 10000);

  const bestComp = equivalents.find(c => c.ratio >= 0.5 && c.ratio <= 5) || equivalents[0];

  document.getElementById('selectedExamDetail').innerHTML = `
    <div class="fw-bold mb-2">${e.name}</div>
    <div class="d-flex gap-3 mb-3">
      <div class="text-center">
        <div class="fw-bold fs-4 text-primary">${formatDose(e.dose)}</div>
        <div class="text-muted" style="font-size:0.72rem">mSv effective</div>
      </div>
      ${e.fetal ? `<div class="text-center">
        <div class="fw-bold fs-5 text-warning">${formatDose(e.fetal)}</div>
        <div class="text-muted" style="font-size:0.72rem">mGy fetal</div>
      </div>` : ''}
    </div>
    <div class="text-muted mb-3" style="font-size:0.82rem">${e.description}</div>
    ${bestComp ? `<div class="comparison-card">
      <div class="text-muted mb-1" style="font-size:0.75rem;font-weight:600">EQUIVALENT TO</div>
      <div class="d-flex align-items-center gap-3">
        <span class="comparison-icon">${bestComp.icon}</span>
        <div>
          <div class="fw-semibold">${bestComp.ratio < 1 ? (1/bestComp.ratio).toFixed(1) + '× less than' : bestComp.ratio.toFixed(1) + '×'} ${bestComp.label}</div>
        </div>
      </div>
    </div>` : ''}
    ${Object.keys(e.organDose || {}).length ? `<div class="mt-2">
      <div class="text-muted mb-1" style="font-size:0.72rem;font-weight:600">ORGAN DOSES (mGy)</div>
      ${Object.entries(e.organDose).map(([organ, dose]) =>
        `<div class="d-flex justify-content-between" style="font-size:0.8rem">
          <span class="text-muted text-capitalize">${organ}</span>
          <span class="fw-semibold">${formatDose(dose)} mGy</span>
        </div>`).join('')}
    </div>` : ''}
  `;
}

// ─── Compare ─────────────────────────────────────────────────────────────────
function populateCompareSelects() {
  const opts = `<option value="">Select exam...</option>` + EXAMS.map(e =>
    `<option value="${e.id}">${e.name} (${formatDose(e.dose)} mSv)</option>`
  ).join('');
  ['compareExam1', 'compareExam2', 'compareExam3'].forEach(id => {
    if (document.getElementById(id)) document.getElementById(id).innerHTML = opts;
  });
}

function updateComparison() {
  const ids = ['compareExam1', 'compareExam2', 'compareExam3'].map(id => document.getElementById(id)?.value).filter(Boolean);
  const selected = ids.map(id => EXAMS.find(e => e.id === id)).filter(Boolean);
  if (!selected.length) {
    document.getElementById('comparisonBars').innerHTML = '';
    document.getElementById('comparisonNarrative').innerHTML = '';
    return;
  }

  const maxDose = Math.max(...selected.map(e => e.dose), 1);
  const colors = ['#2c7be5', '#7c3aed', '#e63757'];

  document.getElementById('comparisonBars').innerHTML = selected.map((e, i) => {
    const pct = Math.min(100, (e.dose / maxDose) * 100);
    const riskClass = e.dose < 0.1 ? 'risk-negligible' : e.dose < 5 ? 'risk-low' : e.dose < 15 ? 'risk-moderate' : 'risk-high';
    const riskLabel = e.dose < 0.1 ? 'Negligible' : e.dose < 5 ? 'Low' : e.dose < 15 ? 'Moderate' : 'High';
    return `<div class="mb-3">
      <div class="d-flex justify-content-between mb-1">
        <span class="fw-semibold">${e.name}</span>
        <div class="d-flex gap-2">
          <span class="risk-badge ${riskClass}">${riskLabel}</span>
          <span class="fw-bold" style="color:${colors[i]}">${formatDose(e.dose)} mSv</span>
        </div>
      </div>
      <div class="dose-bar-wrap" style="height:28px">
        <div class="dose-bar" style="width:${pct}%;background:${colors[i]}"></div>
      </div>
    </div>`;
  }).join('') + `
  <div class="mt-4">
    <div class="fw-semibold mb-2 small text-muted">COMPARED TO ANNUAL BACKGROUND (2.7 mSv)</div>
    ${selected.map((e, i) => `<div class="mb-2">
      <div class="d-flex justify-content-between mb-1" style="font-size:0.82rem">
        <span>${e.name}</span>
        <span>${(e.dose / 2.7 * 100).toFixed(0)}% of annual background</span>
      </div>
      <div class="dose-bar-wrap">
        <div class="dose-bar" style="width:${Math.min(100, e.dose / 2.7 * 100).toFixed(0)}%;background:${colors[i]}"></div>
      </div>
    </div>`).join('')}
  </div>`;

  if (selected.length >= 2) {
    const ratio = (selected[0].dose / selected[1].dose).toFixed(1);
    document.getElementById('comparisonNarrative').innerHTML = `
      <div class="p-3 rounded-3 mt-3" style="background:#f8faff;border-left:4px solid #2c7be5;font-size:0.88rem">
        <strong>${selected[0].name}</strong> delivers <strong>${ratio}×</strong> the dose of <strong>${selected[1].name}</strong>.
        The additional dose from ${selected[0].name} is equivalent to approximately
        <strong>${(selected[0].dose / 2.7 * 365).toFixed(0)} days</strong> of background radiation.
      </div>`;
  }
}

// ─── Pregnancy Calculator ─────────────────────────────────────────────────────
function populatePregExam() {
  const el = document.getElementById('pregExam');
  if (!el) return;
  el.innerHTML = `<option value="">Select examination...</option>` +
    EXAMS.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
}

function calcPregnancy() {
  const examId = document.getElementById('pregExam')?.value;
  const weeks = parseFloat(document.getElementById('pregWeeks')?.value);
  const indication = document.getElementById('pregIndication')?.value;
  const exam = EXAMS.find(e => e.id === examId);
  const container = document.getElementById('pregResult');

  if (!exam || !weeks || weeks < 1 || weeks > 42) {
    container.innerHTML = '';
    return;
  }

  const fetalDose = exam.fetal || 0;
  const threshold = 100; // mGy — NCRP deterministic threshold
  const isAboveThreshold = fetalDose >= threshold;
  const pctThreshold = (fetalDose / threshold * 100).toFixed(1);
  const bgEquiv = (fetalDose / 0.025).toFixed(0); // ~0.025 mGy background per week

  const trimester = weeks <= 13 ? '1st trimester (organogenesis)' : weeks <= 26 ? '2nd trimester' : '3rd trimester';
  const riskPeriod = weeks >= 8 && weeks <= 15 ? 'within the sensitive period for CNS development (8–15 weeks)' : 'outside the most sensitive period for CNS irradiation';

  let riskClass, riskText, recommendation;
  if (fetalDose < 0.1) {
    riskClass = 'safe-result';
    riskText = 'Negligible fetal dose — no additional risk';
    recommendation = 'Proceed without modification. Patient reassurance is appropriate. The fetal dose is comparable to natural background radiation.';
  } else if (fetalDose < 10) {
    riskClass = 'safe-result';
    riskText = 'Low fetal dose — well below harmful threshold';
    recommendation = indication === 'elective'
      ? 'For elective studies, consider whether imaging can be deferred to after delivery or whether MRI (no ionising radiation) could provide equivalent information.'
      : 'Proceed if clinically indicated. Benefits of imaging substantially outweigh the extremely small radiation risk.';
  } else if (fetalDose < 50) {
    riskClass = 'warn-result';
    riskText = 'Moderate fetal dose — below the deterministic threshold of 100 mGy';
    recommendation = 'Clinical benefits almost certainly outweigh risks. Document discussion with patient. Consider whether dose can be reduced (e.g., single phase, low-dose protocol). Fetal dose is ' + pctThreshold + '% of the 100 mGy deterministic threshold.';
  } else {
    riskClass = 'danger-result';
    riskText = 'High fetal dose — approaching or exceeding deterministic threshold';
    recommendation = 'Discuss with radiation protection officer. Benefits vs risks must be carefully weighed. Consider alternatives. Stochastic risk (childhood cancer) may be meaningful.';
  }

  container.innerHTML = `
    <div class="pregnancy-result ${riskClass}">
      <div class="fw-bold mb-2">${riskText}</div>
      <div class="row g-2 mb-3">
        <div class="col-6 text-center">
          <div class="fw-bold fs-4">${formatDose(fetalDose)}</div>
          <div class="text-muted small">mGy fetal dose</div>
        </div>
        <div class="col-6 text-center">
          <div class="fw-bold fs-4">${pctThreshold}%</div>
          <div class="text-muted small">of 100 mGy threshold</div>
        </div>
      </div>
      <div class="mb-2 small"><strong>Trimester:</strong> ${trimester}</div>
      <div class="mb-2 small"><strong>Risk period:</strong> Pregnancy is ${riskPeriod}</div>
      <div class="mb-2 small"><strong>Equivalent to:</strong> ~${bgEquiv} weeks of background radiation to the fetus</div>
      <hr>
      <div class="small fw-semibold mb-1">Recommendation:</div>
      <div class="small">${recommendation}</div>
    </div>`;
}

// ─── Patient Explainer ────────────────────────────────────────────────────────
function populatePatientExam() {
  const el = document.getElementById('patientExam');
  if (!el) return;
  el.innerHTML = `<option value="">Select examination...</option>` +
    EXAMS.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
}

function generatePatientExplainer() {
  const examId = document.getElementById('patientExam')?.value;
  const age = document.getElementById('patientAge')?.value;
  const level = document.getElementById('readingLevel')?.value;
  const exam = EXAMS.find(e => e.id === examId);
  const container = document.getElementById('patientExplainerText');

  if (!exam) { container.innerHTML = `<div class="text-center text-muted py-5"><i class="bi bi-chat-quote fs-3 d-block mb-2"></i>Select an examination to generate a patient-friendly explanation</div>`; return; }

  const bgComparison = exam.dose < 0.01 ? `less than a single day of background radiation` :
    exam.dose < 1 ? `about ${(exam.dose / 0.008).toFixed(0)} days of normal background radiation` :
    exam.dose < 5 ? `about ${(exam.dose / 2.7).toFixed(1)} months of normal background radiation` :
    `about ${(exam.dose / 2.7).toFixed(1)} months of normal background radiation`;

  const riskStatement = exam.dose < 0.1 ?
    (level === 'simple' ? `This amount of radiation is extremely tiny — less than what you get walking outside for a few hours.` :
     `The effective dose is negligible and represents no meaningful additional risk above natural background.`) :
    exam.dose < 10 ?
    (level === 'simple' ? `The amount of radiation is small — about the same as ${bgComparison}.` :
     `The effective dose (${formatDose(exam.dose)} mSv) is low and represents a very small additional lifetime cancer risk, estimated at approximately 1 in ${Math.round(1/(exam.dose * 0.005/100))} or less.`) :
    (level === 'simple' ? `This scan uses more radiation than some others, but your doctor has decided the benefit of finding out what is wrong is much greater than any very small risk.` :
     `The effective dose (${formatDose(exam.dose)} mSv) carries a small but non-negligible stochastic risk. The clinical indication has been carefully weighed against this risk.`);

  const ageContext = age === 'child' ? 'Because children are still growing, they can be a little more sensitive to radiation than adults. We always use the lowest possible dose when scanning children.' :
    age === 'elderly' ? 'At your stage of life, the benefits of getting an accurate diagnosis far outweigh any very small theoretical risk from radiation.' : '';

  const scriptContent = level === 'simple' ? `
    <div style="font-size:0.95rem;line-height:1.8">
      <p><strong>What you're having:</strong> ${exam.name}</p>
      <p><strong>About the radiation:</strong> ${riskStatement} ${ageContext}</p>
      <p><strong>To put it in perspective:</strong> We are all exposed to a small amount of natural radiation every day — from the ground, from space, and even from food. ${exam.dose < 1 ? 'This scan adds only a tiny amount on top of that.' : 'This scan adds a small amount on top of that, but your doctor believes it is important for your health.'}</p>
      <p><strong>Is it safe?</strong> Yes. Your doctor has carefully considered the risks and benefits, and this scan is recommended because knowing what is happening in your body is very important for your treatment.</p>
      <p><strong>Any questions?</strong> Please ask your radiographer or doctor — we are here to help.</p>
    </div>` : `
    <div style="font-size:0.95rem;line-height:1.8">
      <p><strong>Procedure:</strong> ${exam.name}</p>
      <p><strong>Radiation dose:</strong> ${formatDose(exam.dose)} mSv effective dose. ${riskStatement}</p>
      <p><strong>Context:</strong> The average person in the UK receives approximately 2.7 mSv per year from natural background radiation (cosmic rays, radon gas, food). This examination is equivalent to ${bgComparison}.</p>
      ${ageContext ? `<p>${ageContext}</p>` : ''}
      <p><strong>Risk–benefit:</strong> Your doctor has determined that the clinical benefit of this examination — in guiding your diagnosis and treatment — substantially outweighs any theoretical radiation risk. We follow the ALARA principle (As Low As Reasonably Achievable) and use the minimum dose needed to obtain a diagnostic image.</p>
      <p><strong>Alternatives:</strong> If you have concerns, please discuss with your radiologist whether MRI or ultrasound might provide comparable information for your specific condition.</p>
    </div>`;

  container.innerHTML = scriptContent;
}

function copyExplainer() {
  const text = document.getElementById('patientExplainerText')?.innerText;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('[onclick="copyExplainer()"]');
    if (btn) { btn.innerHTML = '<i class="bi bi-check me-1"></i>Copied!'; setTimeout(() => btn.innerHTML = '<i class="bi bi-clipboard me-1"></i>Copy', 2000); }
  });
}
