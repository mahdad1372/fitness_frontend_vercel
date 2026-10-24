export interface CardiovascularAssessmentRequest {
  hdlCholesterolMgDl: number;
  onBloodPressureMedication: boolean;
  diabetic: boolean;
}

export type RiskCategory = "Low" | "Moderate" | "High";

export interface CardiovascularAssessmentResponse {
  rawTenYearRiskPercent: number;
  displayedTenYearRiskPercent: number;
  cappedAtDisplayCeiling: boolean;
  category: RiskCategory;
  age: number;
  gender: string;
  totalCholesterolMgDl: number;
  hdlCholesterolMgDl: number;
  systolicBpMmHg: number;
  onBloodPressureMedication: boolean;
  currentSmoker: boolean;
  diabetic: boolean;
  disclaimer: string;
}