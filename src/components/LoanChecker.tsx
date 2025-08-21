import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

interface LoanData {
  creditScore: string;
  monthlyIncome: string;
  loanAmount: string;
  term: string;
  apr: string;
}

interface LoanResult {
  predictedAPR: number;
  adjustedAPR: number;
  residual: number;
  flagged: boolean;
  negotiable: boolean;
  message: string;
}

// Model coefficients from the Python analysis (intercept, credit_score, income, loan_amount, term)
const BETA = [0.15, -0.0003, 0.000002, 0.000015, 0.002];
const MODEL_RMSE = 0.04; // Training RMSE from model

// Validation ranges
const VALIDATION_RANGES = {
  apr: { min: 0, max: 40, label: "APR" },
  income: { min: 100, max: 50000, label: "Monthly Income" },
  creditScore: { min: 300, max: 850, label: "Credit Score" },
  loanAmount: { min: 1000, max: 35000, label: "Loan Amount" }
};

const validateInput = (loan: LoanData): string | null => {
  const apr = parseFloat(loan.apr);
  const income = parseFloat(loan.monthlyIncome);
  const creditScore = parseFloat(loan.creditScore);
  const loanAmount = parseFloat(loan.loanAmount);

  if (apr < VALIDATION_RANGES.apr.min || apr > VALIDATION_RANGES.apr.max) {
    return `${VALIDATION_RANGES.apr.label} must be between ${VALIDATION_RANGES.apr.min}% and ${VALIDATION_RANGES.apr.max}%`;
  }
  if (income < VALIDATION_RANGES.income.min || income > VALIDATION_RANGES.income.max) {
    return `${VALIDATION_RANGES.income.label} must be between $${VALIDATION_RANGES.income.min.toLocaleString()} and $${VALIDATION_RANGES.income.max.toLocaleString()}`;
  }
  if (creditScore < VALIDATION_RANGES.creditScore.min || creditScore > VALIDATION_RANGES.creditScore.max) {
    return `${VALIDATION_RANGES.creditScore.label} must be between ${VALIDATION_RANGES.creditScore.min} and ${VALIDATION_RANGES.creditScore.max}`;
  }
  if (loanAmount < VALIDATION_RANGES.loanAmount.min || loanAmount > VALIDATION_RANGES.loanAmount.max) {
    return `${VALIDATION_RANGES.loanAmount.label} must be between $${VALIDATION_RANGES.loanAmount.min.toLocaleString()} and $${VALIDATION_RANGES.loanAmount.max.toLocaleString()}`;
  }

  return null;
};

const analyzeLoan = (loan: LoanData): LoanResult => {
  const creditScore = parseFloat(loan.creditScore);
  const monthlyIncome = parseFloat(loan.monthlyIncome);
  const loanAmount = parseFloat(loan.loanAmount);
  const term = parseFloat(loan.term);
  const apr = parseFloat(loan.apr) / 100; // Convert to decimal

  // Build feature vector: [1, credit_score, income, loan_amount, term]
  const x = [1, creditScore, monthlyIncome, loanAmount, term];
  
  // Calculate predicted APR (in decimal)
  const predictedAPR = x.reduce((sum, val, idx) => sum + val * BETA[idx], 0);
  
  // Clip prediction to reasonable range
  const clippedPrediction = Math.max(0, Math.min(1, predictedAPR));
  
  // Calculate difference
  const diff = apr - clippedPrediction;
  const diffInRMSEs = diff / MODEL_RMSE;
  
  // Determine flags based on RMSE thresholds
  const flagged = apr > clippedPrediction + 2.0 * MODEL_RMSE;
  const negotiable = apr > clippedPrediction + 0.5 * MODEL_RMSE;
  
  let message = "";
  if (flagged) {
    message = "⚠️ Your loan's APR is unusually high compared to similar loans. Consider shopping around or negotiating.";
  } else if (negotiable) {
    message = "Your loan's APR is pretty reasonable, but consider negotiating.";
  } else {
    message = "✅ Your loan's APR looks reasonable based on your profile.";
  }

  return {
    predictedAPR: clippedPrediction * 100,
    adjustedAPR: apr * 100,
    residual: diff * 100,
    flagged,
    negotiable,
    message
  };
};

export const LoanChecker = () => {
  const [loanData, setLoanData] = useState<LoanData>({
    creditScore: "",
    monthlyIncome: "",
    loanAmount: "",
    term: "",
    apr: ""
  });
  
  const [result, setResult] = useState<LoanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleInputChange = (field: keyof LoanData, value: string) => {
    setLoanData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleAnalyze = () => {
    if (!loanData.creditScore || !loanData.monthlyIncome || !loanData.loanAmount || !loanData.term || !loanData.apr) {
      return;
    }

    // Validate input ranges
    const validationErrorMsg = validateInput(loanData);
    if (validationErrorMsg) {
      setValidationError(validationErrorMsg);
      return;
    }

    setIsLoading(true);
    setValidationError(null);
    
    // Simulate analysis delay
    setTimeout(() => {
      const analysis = analyzeLoan(loanData);
      setResult(analysis);
      setIsLoading(false);
    }, 1000);
  };

  const resetForm = () => {
    setLoanData({
      creditScore: "",
      monthlyIncome: "",
      loanAmount: "",
      term: "",
      apr: ""
    });
    setResult(null);
    setValidationError(null);
  };

  const isFormValid = Object.values(loanData).every(value => value !== "");

  return (
    <div className="min-h-screen bg-gradient-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Loan Fairness Analyzer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Check if your loan APR is fair based on your financial profile and market data
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Loan Details</CardTitle>
              <CardDescription>
                Enter your loan information to analyze fairness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="creditScore">Credit Score</Label>
                <Input
                  id="creditScore"
                  type="number"
                  placeholder="e.g., 750"
                  min="300"
                  max="850"
                  value={loanData.creditScore}
                  onChange={(e) => handleInputChange("creditScore", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyIncome">Monthly Income ($)</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  placeholder="e.g., 6000"
                  min="0"
                  value={loanData.monthlyIncome}
                  onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loanAmount">Loan Amount ($)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  placeholder="e.g., 15000"
                  min="0"
                  value={loanData.loanAmount}
                  onChange={(e) => handleInputChange("loanAmount", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="term">Loan Term (months)</Label>
                <Select onValueChange={(value) => handleInputChange("term", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                    <SelectItem value="48">48 months</SelectItem>
                    <SelectItem value="60">60 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apr">Current APR (%)</Label>
                <Input
                  id="apr"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 12.5"
                  min="0"
                  max="100"
                  value={loanData.apr}
                  onChange={(e) => handleInputChange("apr", e.target.value)}
                />
              </div>

              {validationError && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  {validationError}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleAnalyze}
                  disabled={!isFormValid || isLoading}
                  className="flex-1 bg-gradient-primary hover:opacity-90 shadow-primary"
                >
                  {isLoading ? "Analyzing..." : "Analyze Loan"}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Analysis Results</CardTitle>
              <CardDescription>
                AI-powered loan fairness assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                  <TrendingUp className="w-16 h-16 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Enter your loan details and click "Analyze Loan" to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    {result.flagged ? (
                      <AlertCircle className="w-8 h-8 text-warning" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-success" />
                    )}
                    <Badge 
                      variant={result.flagged ? "destructive" : result.negotiable ? "secondary" : "default"}
                      className={result.flagged ? "bg-gradient-warning text-warning-foreground" : 
                                 !result.negotiable ? "bg-gradient-success text-success-foreground" : undefined}
                    >
                      {result.flagged ? "Potentially Unfair" : result.negotiable ? "Negotiable" : "Fair Rate"}
                    </Badge>
                  </div>

                  <p className="text-foreground text-lg leading-relaxed">
                    {result.message}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Predicted APR</p>
                      <p className="text-2xl font-bold text-primary">
                        {result.predictedAPR.toFixed(2)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Your APR</p>
                      <p className="text-2xl font-bold">
                        {result.adjustedAPR.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Difference (Residual)</p>
                    <p className={`text-xl font-semibold ${
                      result.residual > 0 ? "text-warning" : "text-success"
                    }`}>
                      {result.residual > 0 ? "+" : ""}{result.residual.toFixed(2)}%
                    </p>
                  </div>

                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="w-full"
                  >
                    Check Another Loan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};