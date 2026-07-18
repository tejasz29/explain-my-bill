export type BillItem = {
  name: string;
  amount: number;
  explanation: string;
  flagged: boolean;
  flag_reason: string | null;
};

export type BillAnalysis = {
  total_amount: number;
  currency: string;
  items: BillItem[];
  anomalies: string[];
  summary: string;
};
