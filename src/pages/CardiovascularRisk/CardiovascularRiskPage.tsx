import { useState } from "react";
import Cookies from "js-cookie";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import { assessCardiovascularRisk } from "../../api/cardiovascularRiskApi";
import { CardiovascularAssessmentResponse, RiskCategory } from "../../types/cardiovascularRisk";

// Same severity-palette pattern as StatTile elsewhere in the app, extended
// with a third "moderate" tone for the standard Low / Moderate / High
// Framingham risk categories.
const CATEGORY_STYLE: Record<RiskCategory, { bg: string; text: string }> = {
  Low: { bg: "#d1fadf", text: "#067647" },
  Moderate: { bg: "#fef0c7", text: "#b54708" },
  High: { bg: "#fee4e2", text: "#b42318" },
};

export default function CardiovascularRiskPage() {
  const userId = Number(Cookies.get("userId"));

  const [hdl, setHdl] = useState("");
  const [onBpMedication, setOnBpMedication] = useState(false);
  const [diabetic, setDiabetic] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CardiovascularAssessmentResponse | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const hdlValue = Number(hdl);
    if (!hdl || Number.isNaN(hdlValue) || hdlValue <= 0) {
      setError("Enter a valid HDL cholesterol value (mg/dL).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await assessCardiovascularRisk(userId, {
        hdlCholesterolMgDl: hdlValue,
        onBloodPressureMedication: onBpMedication,
        diabetic,
      });
      setResult(res);
    } catch (err) {
      console.error("Error calculating cardiovascular risk:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to calculate cardiovascular risk."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Cardiovascular Risk | Fitness - Admin Dashboard Template"
        description="A 10-year cardiovascular risk screening estimate using the published Framingham Heart Study equation"
      />
      <PageBreadcrumb pageTitle="Cardiovascular Risk" />
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#dde9ff] bg-[#ecf3ff] p-5 dark:border-brand-800 dark:bg-brand-950">
          <p className="text-sm text-brand-600 dark:text-brand-300 max-w-3xl">
            This estimates 10-year cardiovascular disease risk using the real, published Framingham Heart Study
            equation (D'Agostino et al., 2008) - a statistical model built from decades of cohort data, fit by
            log-linear hazard regression rather than solved by a search or graph algorithm like the app's other
            optimizers. It's a risk-screening estimate, <strong>not a diagnosis</strong>, and isn't a substitute for
            professional medical evaluation - please discuss your results with a doctor.
          </p>
        </div>

        <ComponentCard
          title="Additional risk factors"
          desc="Age, sex, smoking status, total cholesterol, and blood pressure are pulled automatically from your profile, health metrics, and connected Google Fit data. A few more factors aren't tracked anywhere else yet, so enter them here."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>HDL Cholesterol (mg/dL)</Label>
              <Input
                type="number"
                placeholder="e.g. 50"
                value={hdl}
                onChange={(e) => setHdl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 mb-4">
            <Checkbox
              label="Currently on blood pressure medication"
              checked={onBpMedication}
              onChange={setOnBpMedication}
            />
            <Checkbox label="Diagnosed with diabetes" checked={diabetic} onChange={setDiabetic} />
          </div>
          {error && <div className="text-error-500 text-sm mb-3">{error}</div>}
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Calculating..." : "Calculate My Risk"}
          </Button>
        </ComponentCard>

        {result && (
          <>
            <ComponentCard title="Your 10-year cardiovascular risk">
              <div className="flex items-center gap-6 flex-wrap">
                <div
                  className="rounded-xl p-6 min-w-[200px] text-center"
                  style={{ backgroundColor: CATEGORY_STYLE[result.category].bg }}
                >
                  <div className="text-4xl font-bold" style={{ color: CATEGORY_STYLE[result.category].text }}>
                    {result.displayedTenYearRiskPercent.toFixed(1)}%
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: CATEGORY_STYLE[result.category].text }}>
                    {result.category} risk
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                  {result.cappedAtDisplayCeiling ? (
                    <p>
                      Your combined risk factors put the underlying calculation above the equation's well-validated
                      range, so - matching how the official Framingham table tops out at "30% or more" - this is
                      shown capped at 30%, rather than an unqualified, less meaningful larger number.
                    </p>
                  ) : (
                    <p>
                      Based on the inputs below, using the Framingham General Cardiovascular Disease 10-year risk
                      equation.
                    </p>
                  )}
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Inputs used">
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/[0.05] text-sm">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-500 dark:text-gray-400">Age</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">{result.age}</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-500 dark:text-gray-400">Sex</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">{result.gender}</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-500 dark:text-gray-400">Total cholesterol</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    {result.totalCholesterolMgDl} mg/dL
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-500 dark:text-gray-400">HDL cholesterol</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    {result.hdlCholesterolMgDl} mg/dL
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-500 dark:text-gray-400">Systolic blood pressure</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    {result.systolicBpMmHg.toFixed(0)} mmHg (from Google Fit)
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-500 dark:text-gray-400">On blood pressure medication</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    {result.onBloodPressureMedication ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-500 dark:text-gray-400">Current smoker</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    {result.currentSmoker ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-500 dark:text-gray-400">Diabetic</span>
                  <span className="font-semibold text-gray-800 dark:text-white/90">
                    {result.diabetic ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </ComponentCard>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-400 italic">{result.disclaimer}</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}