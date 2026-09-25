// Lokalt och i testerna är NEXT_PUBLIC_API_URL satt till http://127.0.0.1:3001,
// och då anropar webbläsaren backend direkt. Om den inte är satt (som på AWS)
// anropas sajtens egen adress, och Next.js skickar vidare till backend (se next.config.ts).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const TOKEN_KEY = "bank-token";

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? `Något gick fel (status ${response.status}).`);
  }

  return data as T;
}

export function createUser(username: string, password: string) {
  return post<{ id: number; username: string }>("/users", { username, password });
}

export function login(username: string, password: string) {
  return post<{ token: string }>("/sessions", { username, password });
}

export function getAccount(token: string) {
  return post<{ amount: number }>("/me/accounts", { token });
}

export function deposit(token: string, amount: number) {
  return post<{ amount: number }>("/me/accounts/transactions", { token, amount });
}

export function formatKr(amount: number) {
  return `${amount.toLocaleString("sv-SE")} kr`;
}
