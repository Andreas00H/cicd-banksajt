import Link from "next/link";

export default function HomePage() {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm sm:p-12">
      <h1 className="text-4xl font-bold sm:text-5xl">Välkommen till Banken</h1>
      <p className="mt-4 max-w-xl text-lg text-gray-600">
        En enkel och trygg bank. Skapa ett konto på några sekunder, logga in och
        håll koll på ditt saldo.
      </p>
      <Link
        className="mt-8 inline-block rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800"
        href="/register"
      >
        Skapa konto
      </Link>
    </section>
  );
}
