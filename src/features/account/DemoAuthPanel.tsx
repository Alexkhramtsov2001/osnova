import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router";
import ArrowIcon from "../../components/ArrowIcon";
import {
  createDemoCode,
  normalizeDemoEmail,
  readDemoProfile,
  writeDemoProfile,
  writeDemoSession,
  type DemoProfile,
  type DemoSessionSource,
} from "./demoSession";

type Method = "email" | "google" | "apple";
type AuthView = "login" | "register";
type Challenge = {
  method: Method;
  intent: "login" | "register" | "provider";
  code: string;
  profile?: DemoProfile;
};

const providerNames = { google: "Google", apple: "Apple" } as const;

export default function DemoAuthPanel({
  onAuthenticated,
  initialView,
}: {
  onAuthenticated: (source: DemoSessionSource) => void;
  initialView?: "login" | "register";
}) {
  const [localProfile, setLocalProfile] = useState(() => readDemoProfile(window.localStorage));
  const [view, setView] = useState<AuthView>(
    () => initialView ?? (readDemoProfile(window.localStorage) ? "login" : "register"),
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => localProfile?.email ?? "");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [codeNotice, setCodeNotice] = useState("");
  const codeInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!challenge) return;
    const frame = window.requestAnimationFrame(() => codeInputs.current[0]?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [challenge]);

  const startChallenge = (next: Omit<Challenge, "code">) => {
    setChallenge({ ...next, code: createDemoCode() });
    setDigits(Array(6).fill(""));
    setError("");
    setCodeNotice("");
  };

  const onEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validEmail = normalizeDemoEmail(email);
    if (!validEmail) {
      setError(
        "Используйте только учебный адрес вида имя@osnova.test. Настоящую почту вводить не нужно.",
      );
      return;
    }
    if (view === "register") {
      const validName = name.trim();
      if (validName.length < 2 || validName.length > 80) {
        setError("Укажите имя длиной от 2 до 80 символов.");
        return;
      }
      startChallenge({
        method: "email",
        intent: "register",
        profile: { name: validName, email: validEmail },
      });
      return;
    }
    if (!localProfile || validEmail !== localProfile.email) {
      setError("На этом устройстве нет профиля с таким учебным адресом. Создайте демо-профиль.");
      return;
    }
    startChallenge({ method: "email", intent: "login", profile: localProfile });
  };

  const onProvider = (method: "google" | "apple") => {
    startChallenge({ method, intent: "provider" });
  };

  const openCabinet = (source: DemoSessionSource) => {
    if (!writeDemoSession(window.sessionStorage, source)) {
      setError("Браузер не разрешил открыть демо-кабинет. Проверьте настройки хранилища вкладки.");
      return;
    }
    onAuthenticated(source);
  };

  const submitCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!challenge) return;
    if (digits.join("") !== challenge.code) {
      setError("Код не совпал с демо-письмом. Проверьте шесть цифр и попробуйте снова.");
      return;
    }
    if (challenge.intent === "register" && challenge.profile) {
      if (!writeDemoProfile(window.localStorage, challenge.profile)) {
        setError("Не удалось сохранить учебный профиль в этом браузере.");
        return;
      }
      setLocalProfile(challenge.profile);
    }
    openCabinet(challenge.method);
  };

  const setCodeDigit = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      setDigits((current) => current.map((digit, position) => (position === index ? "" : digit)));
      setError("");
      return;
    }
    const next = [...digits];
    for (let offset = 0; offset < cleaned.length && index + offset < 6; offset += 1)
      next[index + offset] = cleaned[offset];
    setDigits(next);
    setError("");
    codeInputs.current[Math.min(index + cleaned.length, 5)]?.focus();
  };

  const onCodeKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
      setCodeDigit(index - 1, "");
    }
    if (event.key === "ArrowLeft" && index > 0) codeInputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) codeInputs.current[index + 1]?.focus();
  };

  const resendCode = () => {
    if (!challenge) return;
    let nextCode = createDemoCode();
    if (nextCode === challenge.code)
      nextCode = String((Number(nextCode) + 1) % 1_000_000).padStart(6, "0");
    setChallenge({ ...challenge, code: nextCode });
    setDigits(Array(6).fill(""));
    setError("");
    setCodeNotice("Новый учебный код создан. Старый больше не подходит.");
    codeInputs.current[0]?.focus();
  };

  return (
    <section className="account-login-card account-auth-card" aria-labelledby="account-login-title">
      <div className="account-auth-context">
        <p className="eyebrow">ЛИЧНЫЙ КАБИНЕТ / ДЕМО</p>
        <h2>
          Сохраните свой <span>маршрут к дому.</span>
        </h2>
        <p>
          Избранные концепции и расчёты уже хранятся в этом браузере. Учебный вход открывает их в
          одном кабинете; каталог, калькулятор и демо-оплата доступны и без входа.
        </p>
        <div className="account-demo-note">
          <strong>Никакой реальной регистрации и отправки писем</strong>
          <p>
            Используйте только адрес <code>имя@osnova.test</code>. Код появится здесь в блоке
            «Демо-письмо». Google и Apple показаны как макеты сценария: сайт не подключается к этим
            сервисам.
          </p>
          <p>
            Профиль, избранное и сметы остаются на этом устройстве. Не вводите настоящий email или
            пароль.
          </p>
        </div>
        <div className="account-auth-links">
          <Link to="/projects">
            Посмотреть проекты <ArrowIcon />
          </Link>
          <Link to="/calculator">
            Сделать расчёт <ArrowIcon />
          </Link>
        </div>
      </div>

      <div className="account-auth-panel">
        {challenge ? (
          <div className="account-code-view">
            <p className="eyebrow">ПОДТВЕРЖДЕНИЕ / ДЕМО</p>
            <h2 id="account-login-title">Введите код из письма</h2>
            <p>
              В настоящем сервисе код пришёл бы на почту, связанную с{" "}
              {challenge.method === "email"
                ? "учебным адресом"
                : `${providerNames[challenge.method]} аккаунтом`}
              . Здесь письмо имитируется прямо на странице.
            </p>
            <div className="account-demo-mail" role="status">
              <span>ДЕМО-ПИСЬМО · НИЧЕГО НЕ ОТПРАВЛЕНО</span>
              <strong>
                {challenge.code.slice(0, 3)}–{challenge.code.slice(3)}
              </strong>
              <small>Код действует только пока открыт этот экран.</small>
            </div>
            <form onSubmit={submitCode}>
              <div
                className="account-code-digits"
                role="group"
                aria-label="Шестизначный учебный код"
              >
                {digits.map((digit, index) => (
                  <Fragment key={index}>
                    {index === 3 && (
                      <span className="account-code-separator" aria-hidden="true">
                        —
                      </span>
                    )}
                    <input
                      ref={(node) => {
                        codeInputs.current[index] = node;
                      }}
                      aria-label={`Цифра ${index + 1}`}
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={digit}
                      onChange={(event) => setCodeDigit(index, event.target.value)}
                      onKeyDown={(event) => onCodeKeyDown(event, index)}
                      onPaste={(event) => {
                        const pasted = event.clipboardData.getData("text");
                        if (/^\d{6}$/.test(pasted)) {
                          event.preventDefault();
                          setCodeDigit(0, pasted);
                        }
                      }}
                    />
                  </Fragment>
                ))}
              </div>
              {error && (
                <p className="account-message account-error" role="alert">
                  {error}
                </p>
              )}
              <div className="account-code-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    setChallenge(null);
                    setError("");
                  }}
                >
                  Назад
                </button>
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={digits.some((digit) => !digit)}
                >
                  Готово
                </button>
              </div>
            </form>
            <div className="account-resend">
              <span>Не получили код подтверждения?</span>
              <button type="button" onClick={resendCode}>
                Создать новый демо-код
              </button>
            </div>
            {codeNotice && (
              <p className="account-code-notice" role="status">
                {codeNotice}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="account-auth-tabs" role="tablist" aria-label="Способ входа">
              <button
                type="button"
                role="tab"
                aria-selected={view === "register"}
                onClick={() => {
                  setView("register");
                  setError("");
                }}
              >
                Регистрация
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "login"}
                onClick={() => {
                  setView("login");
                  setError("");
                }}
              >
                Повторный вход
              </button>
            </div>
            <form className="account-login-form" onSubmit={onEmailSubmit}>
              <h2 id="account-login-title">
                {view === "register" ? "Создать демо-профиль" : "Войти снова"}
              </h2>
              {view === "register" && (
                <label>
                  Как к вам обращаться
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={80}
                    required
                    autoComplete="off"
                    placeholder="Например, Анна"
                  />
                </label>
              )}
              <label>
                Учебный email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="off"
                  placeholder="имя@osnova.test"
                />
              </label>
              {view === "login" && !localProfile && (
                <p className="account-auth-hint">
                  На этом устройстве пока нет учебного профиля. Выберите «Регистрация».
                </p>
              )}
              {localProfile && view === "register" && (
                <p className="account-auth-hint">
                  Новый учебный профиль заменит имя и email предыдущего. Избранное и расчёты этого
                  браузера останутся общими.
                </p>
              )}
              {error && (
                <p className="account-message account-error" role="alert">
                  {error}
                </p>
              )}
              <button className="button button-primary" type="submit">
                {view === "register" ? "Продолжить регистрацию" : "Получить код для входа"}
              </button>
            </form>
            <div className="account-provider-divider">
              <span>ИЛИ ПРОДОЛЖИТЬ ЧЕРЕЗ ДЕМО</span>
            </div>
            <div className="account-provider-actions">
              <button
                type="button"
                className="account-provider-button"
                onClick={() => onProvider("google")}
              >
                <img src={`${import.meta.env.BASE_URL}images/auth/google.svg`} alt="" />
                Войти через Google
              </button>
              <button
                type="button"
                className="account-provider-button"
                onClick={() => onProvider("apple")}
              >
                <img src={`${import.meta.env.BASE_URL}images/auth/apple.svg`} alt="" />
                Войти через Apple
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
