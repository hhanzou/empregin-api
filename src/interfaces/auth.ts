export interface AuthenticatedUser {
  userId: number;
  role: "ADMIN" | "COMPANY_ADMIN" | "COMPANY_HR" | "USER";
  companyId?: number;
  email?: string;
}
