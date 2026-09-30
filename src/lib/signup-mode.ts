export type SignupMode = "approval" | "open" | "closed";

/**
 * How public self-signup behaves, set by the operator via SIGNUP_MODE:
 * - "approval" (default): accounts are created but can't log in until an admin approves them
 * - "open": accounts are active immediately
 * - "closed": no self-signup; admins create accounts
 * The older ALLOW_SIGNUP="false" is still honoured as "closed".
 */
export function signupMode(): SignupMode {
  if (process.env.ALLOW_SIGNUP === "false") return "closed";
  const mode = process.env.SIGNUP_MODE;
  return mode === "open" || mode === "closed" ? mode : "approval";
}
