"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { deposit, formatKr, getAccount, TOKEN_KEY } from "@/lib/api";
import { buttonClass, cardClass, inputClass } from "@/components/form-styles";
import { useHydrated } from "@/lib/use-hydrated";
import { SavingsPanel } from "@/components/savings-panel";

// Klientdelen av kontosidan (saldo, insättning, utloggning).
// showSavings kommer från feature flaggan FEATURE_SAVINGS via page.tsx.
export default function AccountClient({ showSavings }: { showSavings: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Hämta saldot när sidan öppnas
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    getAccount(token)
      .then((data) => setBalance(data.amount))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Kunde inte hämta saldot."),
      );
  }, [router]);

  async function handleDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await deposit(token, Number(amount));
      setBalance(data.amount);
      setMessage(`Du satte in ${formatKr(Number(amount))}.`);
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Insättningen misslyckades.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    router.push("/login");
  }

  return (
    <section className={cardClass}>
      <h1 className="text-2xl font-bold">Mitt konto</h1>

      <div className="mt-6 rounded-xl bg-emerald-50 p-6">
        <p className="text-sm font-medium text-emerald-800">Saldo</p>
        <p className="mt-1 text-4xl font-bold text-emerald-900">
          {balance === null ? "Hämtar…" : formatKr(balance)}
        </p>
      </div>

      {/* VG: ny funktion som bara visas när feature flaggan är på */}
      {showSavings ? <SavingsPanel balance={balance} /> : null}

      <form className="mt-6 space-y-4" onSubmit={handleDeposit}>
        <div>
          <label className="mb-1 block font-medium" htmlFor="amount">
            Belopp
          </label>
          <input
            className={inputClass}
            id="amount"
            min="1"
            onChange={(e) => setAmount(e.target.value)}
            required
            type="number"
            value={amount}
          />
        </div>

        <button className={buttonClass} disabled={!hydrated || loading} type="submit">
          Sätt in
        </button>
      </form>

      {message ? (
        <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-emerald-800">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">
          {error}{" "}
          <Link className="font-semibold underline" href="/login">
            Logga in igen
          </Link>
        </p>
      ) : null}

      <button
        className="mt-6 text-sm font-semibold text-gray-600 underline"
        onClick={handleLogout}
        type="button"
      >
        Logga ut
      </button>
    </section>
  );
}
