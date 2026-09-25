import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { initDatabase, query } from "./db.js";

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Generera engångslösenord
function generateOTP() {
  // Generera en sexsiffrig numerisk OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

// Hjälpfunktion: hitta kontot som hör till en token, eller null
async function findAccountByToken(token) {
  const rows = await query(
    `SELECT accounts.id, accounts.amount
     FROM sessions
     JOIN accounts ON accounts.user_id = sessions.user_id
     WHERE sessions.token = ?
     ORDER BY sessions.id DESC
     LIMIT 1`,
    [String(token ?? "")],
  );
  return rows[0] ?? null;
}

// Skapa användare – Create (INSERT)
app.post("/users", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    return res.status(400).json({ error: "Användarnamn och lösenord krävs." });
  }

  try {
    const result = await query("INSERT INTO users (username, password) VALUES (?, ?)", [
      username.trim(),
      password,
    ]);

    // Varje ny användare får ett bankkonto med 0 kr
    await query("INSERT INTO accounts (user_id, amount) VALUES (?, 0)", [result.insertId]);

    res.status(201).json({ id: result.insertId, username: username.trim() });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Användarnamnet är redan taget." });
    }
    console.error(error);
    res.status(500).json({ error: "Kunde inte skapa användaren." });
  }
});

// Logga in – Read (SELECT) och Create (INSERT i sessions)
app.post("/sessions", async (req, res) => {
  const { username, password } = req.body ?? {};

  try {
    const users = await query("SELECT id FROM users WHERE username = ? AND password = ?", [
      String(username ?? "").trim(),
      String(password ?? ""),
    ]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Fel användarnamn eller lösenord." });
    }

    const token = generateOTP();
    await query("INSERT INTO sessions (user_id, token) VALUES (?, ?)", [users[0].id, token]);

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Kunde inte logga in." });
  }
});

// Visa saldo – Read (SELECT)
app.post("/me/accounts", async (req, res) => {
  try {
    const account = await findAccountByToken(req.body?.token);

    if (!account) {
      return res.status(401).json({ error: "Ogiltigt engångslösenord." });
    }

    res.json({ amount: Number(account.amount) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Kunde inte hämta saldot." });
  }
});

// Sätt in pengar – Update (UPDATE)
app.post("/me/accounts/transactions", async (req, res) => {
  try {
    const account = await findAccountByToken(req.body?.token);

    if (!account) {
      return res.status(401).json({ error: "Ogiltigt engångslösenord." });
    }

    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Beloppet måste vara ett positivt tal." });
    }

    await query("UPDATE accounts SET amount = amount + ? WHERE id = ?", [amount, account.id]);
    const rows = await query("SELECT amount FROM accounts WHERE id = ?", [account.id]);

    res.json({ amount: Number(rows[0].amount) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Insättningen misslyckades." });
  }
});

// Anslut till databasen först, starta sedan servern
try {
  await initDatabase();
} catch (error) {
  console.error("Kunde inte ansluta till databasen. Är MySQL (t.ex. MAMP) igång?");
  console.error(error.message);
  process.exit(1);
}

app.listen(port, () => {
  console.log(`Bankens backend körs på http://localhost:${port}`);
});
