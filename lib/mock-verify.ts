/**
 * Mock identity verification services
 * All clearly labelled as simulated — never wire up real APIs in prototype scope.
 */

/** Validate Aadhaar format: exactly 12 digits */
export function isValidAadhaarFormat(aadhaar: string): boolean {
  return /^\d{12}$/.test(aadhaar);
}

/** Validate PAN format: ABCDE1234F */
export function isValidPanFormat(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
}

/**
 * Mock Aadhaar verification — simulates a 1.5s API delay then returns verified.
 * In production this would call UIDAI's AUA API (requires ₹20L+ license).
 */
export async function mockVerifyAadhaar(
  aadhaar: string,
): Promise<{ verified: boolean; token: string; message: string }> {
  await new Promise((res) => setTimeout(res, 1500));

  if (!isValidAadhaarFormat(aadhaar)) {
    return { verified: false, token: "", message: "Aadhaar must be 12 digits" };
  }

  // In a real system, this token would be a UIDAI reference ID
  const token = `MOCK_AADHAAR_${aadhaar.slice(-4)}_${Date.now()}`;
  return { verified: true, token, message: "[SIMULATED] Aadhaar verified" };
}

/**
 * Mock PAN verification — validates format locally.
 * In production this would call NSDL/Protean API.
 */
export async function mockVerifyPan(
  pan: string,
): Promise<{ verified: boolean; token: string; message: string }> {
  await new Promise((res) => setTimeout(res, 800));
  const normalised = pan.toUpperCase();

  if (!isValidPanFormat(normalised)) {
    return { verified: false, token: "", message: "Invalid PAN format (e.g. ABCDE1234F)" };
  }

  const token = `MOCK_PAN_${normalised}_OK`;
  return { verified: true, token, message: "[SIMULATED] PAN verified" };
}

/**
 * Returns the test OTP.
 * In production this would dispatch a real SMS via a registered gateway.
 */
export function getTestOtp(): string {
  if (process.env.NODE_ENV === "production") {
    // Should never reach here — OTP service must be wired before production
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  return process.env.NEXT_PUBLIC_DEMO_OTP ?? "123456";
}

/** Generate a booking completion OTP (6 digits) */
export function generateBookingOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
