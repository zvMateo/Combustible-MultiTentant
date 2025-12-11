// src/lib/jwt.ts
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  IdCompany?: string;
  IdBusinessUnit?: string;
  exp?: number;
  iss?: string;
  aud?: string;
}

export function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);

    console.log("🔍 [JWT] Token decodificado:", decoded);

    // El userId está en nameidentifier
    const userId =
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    console.log("✅ [JWT] userId extraído:", userId);

    return userId || null;
  } catch (error) {
    console.error("❌ [JWT] Error decodificando token:", error);
    return null;
  }
}

export function getUserNameFromToken(token: string): string | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return (
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      decoded.sub ||
      null
    );
  } catch {
    return null;
  }
}

export function getRoleFromToken(token: string): string | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return (
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      null
    );
  } catch {
    return null;
  }
}

export function getCompanyIdFromToken(token: string): number | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    console.log("🔍 [JWT] Token decodificado completo:", decoded);
    console.log("🔍 [JWT] IdCompany del token:", decoded.IdCompany);
    
    if (decoded.IdCompany) {
      const idCompany = parseInt(decoded.IdCompany, 10);
      console.log("✅ [JWT] idCompany extraído del token:", idCompany);
      return idCompany;
    }
    
    console.warn("⚠️ [JWT] IdCompany no encontrado en el token");
    return null;
  } catch (error) {
    console.error("❌ [JWT] Error decodificando token para idCompany:", error);
    return null;
  }
}

export function getBusinessUnitIdFromToken(token: string): number | null {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.IdBusinessUnit ? parseInt(decoded.IdBusinessUnit) : null;
  } catch {
    return null;
  }
}
