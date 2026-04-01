import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../lib/AuthContext";

const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const role = useMemo(() => {
    const selected = searchParams.get("role");
    return selected === "driver" ? "driver" : "user";
  }, [searchParams]);

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", city: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password, role }
          : { name: form.name, city: form.city, email: form.email, password: form.password, role };

      const { data } = await api.post(endpoint, payload);
      
      // Save auth to context and localStorage
      login(data.token, data.user);
      
      // Navigate to appropriate dashboard
      if (data.user.role === "driver") {
        navigate("/driver/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
      console.error("Auth error:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="hero-copy">
        <h1>RideFlow</h1>
        <p>Modern ride booking with realtime matching, shortest route intelligence, and instant city autosuggestions.</p>
      </div>

      <div className="glass-card">
        <div className="role-toggle">
          <button
            type="button"
            className={role === "user" ? "active" : ""}
            onClick={() => setSearchParams({ role: "user" })}
          >
            User
          </button>
          <button
            type="button"
            className={role === "driver" ? "active" : ""}
            onClick={() => setSearchParams({ role: "driver" })}
          >
            Driver
          </button>
        </div>

        <div className="mode-toggle">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />

              <label>City</label>
              <input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
            </>
          )}

          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />

          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />

          {error ? <p className="error-text">{error}</p> : null}

          <button className="cta" disabled={busy} type="submit">
            {busy ? "Please wait..." : `${mode === "login" ? "Login" : "Create account"} as ${role}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
