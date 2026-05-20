export interface MonthlyForecast {
  month: string;
  predictedAmount: number;
  amountLowerBound: number;
  amountUpperBound: number;
  predictedCount: number;
  countLowerBound: number;
  countUpperBound: number;
}

export interface ForecastResult {
  bankName: string | null;
  mccGroup: string | null;
  modelUsed: string | null;
  accuracy: number;
  confidenceLevel: number;
  forecasts: MonthlyForecast[] | null;
}

export interface ForecastParams {
  bank?: string;
  mcc?: string;
  horizon?: number;
}

export interface ForecastAllParams {
  horizon?: number;
}

export interface ForecastTrainParams {
  bank?: string;
  mcc?: string;
}
