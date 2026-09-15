# SCORE + CKD Patch implementation

The cardiovascular-death card uses a local, independent transcription of the published equations. No patient inputs are sent to the reference website.

Sources:

- SCORE, Conroy et al., European Heart Journal 2003;24:987–1003, Appendix A: https://doi.org/10.1016/S0195-668X(03)00114-3
- CKD Prognosis Consortium, Matsushita et al., EClinicalMedicine 2020;27:100552, Web Tables 6 and 13: https://doi.org/10.1016/j.eclinm.2020.100552
- Equation supplement: https://ars.els-cdn.com/content/image/1-s2.0-S2589537020302960-mmc1.docx
- Reference calculator: https://ckdpcrisk.org/ckdpatchscore/

The model combines coronary and noncoronary fatal-event risks, each adjusted separately for kidney measures, and caps the sum at 1. UACR is in mg/g, transformed as log base 8 and centered at 8 mg/g. Total cholesterol is in mmol/L. The calculation has a fixed ten-year horizon.

## Limits and calibration

This UI conservatively limits use to the reference calculator's selectable bounds: ages 40–65, eGFR 15–120, UACR 5–1500 mg/g, systolic BP 90–180 mm Hg and total cholesterol 3.879–7.241 mmol/L. Continuous values within those bounds are accepted. Missing UACR does not silently fall back to the different eGFR-only patch. Known cardiovascular disease suppresses the baseline. These are implementation limits, not a claim that the full CKD-PC study only included ages 40–65.

The calculator is fixed to the low-risk European calibration; the high-risk calibration is no longer selectable in the UI, though `scoreCkdRisk` still implements both and the tests cover both. Neither is calibrated for Canada, and KFRE's region selector does not change SCORE. Trial hazard ratios and their CIs are applied using the same survival-scale approximation as the other cards. The treated CI does not include baseline uncertainty. This is not a trial-validated treatment-benefit model.

## Unresolved discrepancy with the live calculator

The published equation and live calculator do not match exactly. The UI labels this a research estimate and discloses the discrepancy; no fitted correction has been introduced to force agreement.

Synthetic example: man aged 60, SBP 120, total cholesterol 5.1 mmol/L, nonsmoker, eGFR 45, UACR 30 mg/g.

- Original SCORE low-risk: implementation 1.9998658%; reference 1.99987%.
- Original SCORE high-risk: implementation 3.6733330%; reference 3.67333%.
- Published CKD Patch low-risk: implementation 4.5294081%; reference 4.61982%.
- Published CKD Patch high-risk: implementation 8.2790671%; reference 8.44069%.

Second synthetic example: woman aged 60, SBP 140, total cholesterol 5.2 mmol/L, current smoker, eGFR 90, UACR 8 mg/g. Published-equation low/high estimates are 2.4615731% / 3.6979845%; the reference returns 2.51398% / 3.77574%.

Web Table 13 prints 5.47 and 5.57 as different exponents within the high-risk male noncoronary term. The implementation uses 5.47 consistently, as in original SCORE Appendix A. The original unpatched reference estimates confirm that parameterization. The remaining patched-model discrepancy is unresolved and should be reviewed before clinical deployment.

Validation: independently transcribed numerical examples in Python, original SCORE controls from the reference calculator, input eligibility checks, horizon/calibration isolation and treatment-range ordering. Tests do not claim exact equivalence to the live patched calculator.
