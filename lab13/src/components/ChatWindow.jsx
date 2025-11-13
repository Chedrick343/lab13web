import { useEffect, useState } from "react";
import Message from "./Message.jsx";
import Suggestions from "./Suggestions.jsx";
import { buscarEnModelo } from "../services/localSearch.js";
import { consultarIA } from "../services/openaiService.js";

export default function ChatWindow() {
  const [mensajes, setMensajes] = useState([]);
  const [entrada, setEntrada] = useState("");
  const [sugerencias, setSugerencias] = useState([]);

  // Mensaje de bienvenida
  useEffect(() => {
    setMensajes([
      {
        sender: "bot",
        text: "Hola, soy el asistente virtual del Banco Damena. ¿En qué puedo ayudarte hoy?"
      }
    ]);
    setSugerencias([
      "Consultar saldo",
      "Ver mis cuentas",
      "Ver mis tarjetas",
      "Historial de transferencias"
    ]);
  }, []);

  function agregarMensaje(sender, text) {
    setMensajes((prev) => [...prev, { sender, text }]);
  }

  function generarRespuestaLocal(contexto, pregunta) {
    if (!contexto) {
      return (
        "Esta información no está explícitamente en el sistema del Banco Damena, " +
        "pero puedo darte una orientación general sobre temas bancarios."
      );
    }

    switch (contexto.tipo) {
      case "saldo": {
        const c = contexto.cuenta;
        if (!c) return "No encontré una cuenta asociada para mostrar tu saldo.";
        return `Según el sistema del Banco Damena, tu cuenta "${c.alias}" (IBAN ${c.iban}) tiene un saldo de ${c.saldo.toLocaleString("es-CR", { style: "currency", currency: c.moneda === "m2" ? "USD" : "CRC" })}.`;
      }

      case "usuario_info": {
        const u = contexto.usuario;
        const cuentas = contexto.cuentas || [];
        const tarjetas = contexto.tarjetas || [];
        return (
          `He encontrado información de ${u.nombre} ${u.apellido}.\n` +
          `Tiene ${cuentas.length} cuenta(s) registrada(s) y ${tarjetas.length} tarjeta(s) asociada(s) en el sistema del Banco Damena.`
        );
      }

      case "cuenta_detalle": {
        const c = contexto.cuenta;
        return (
          `Detalles de la cuenta "${c.alias}":\n` +
          `IBAN: ${c.iban}\n` +
          `Saldo: ${c.saldo} (${c.moneda})\n` +
          `Estado: ${c.estado}`
        );
      }

      case "tarjeta_detalle": {
        const t = contexto.tarjeta;
        return (
          `Detalles de la tarjeta ${t.numero_enmascarado}:\n` +
          `Tipo: ${t.tipo}\n` +
          `Moneda: ${t.moneda}\n` +
          `Fecha de expiración: ${t.fecha_expiracion}`
        );
      }

      case "transferencias": {
        const ts = contexto.transferencias || [];
        if (ts.length === 0) {
          return "No se encontraron transferencias recientes en el sistema.";
        }
        const primera = ts[0];
        return (
          `He encontrado ${ts.length} transferencia(s) registrada(s). ` +
          `Por ejemplo, el ${primera.fecha_transferencia} se registró una transferencia de ${primera.monto} por "${primera.descripcion}".`
        );
      }

      case "tipo_cuenta": {
        const tc = contexto.tipoCuenta;
        return `La cuenta de tipo "${tc.nombre}" es: ${tc.descripcion}.`;
      }

      case "moneda": {
        const m = contexto.moneda;
        return `La moneda "${m.nombre}" tiene el código ISO ${m.iso}.`;
      }

      case "tipo_identificacion": {
        const tid = contexto.tipoId;
        return `El tipo de identificación "${tid.nombre}" se describe como: ${tid.descripcion}.`;
      }

      case "rol": {
        const r = contexto.rol;
        return `El rol "${r.nombre}" se describe como: ${r.descripcion}.`;
      }

      case "seguridad":
      case "bloqueo_tarjeta":
        return contexto.mensaje;

      default:
        return (
          "He encontrado información relacionada en el sistema del Banco Damena, " +
          "pero voy a complementar la respuesta con detalles adicionales."
        );
    }
  }

  function generarSugerencias(ctx) {
    if (!ctx) {
      setSugerencias([
        "Consultar saldo",
        "Ver mis cuentas",
        "Ver mis tarjetas",
        "Historial de transferencias"
      ]);
      return;
    }

    switch (ctx.tipo) {
      case "usuario_info":
        setSugerencias([
          "Ver cuentas de este usuario",
          "Ver tarjetas de este usuario",
          "Historial de transacciones"
        ]);
        break;

      case "saldo":
        setSugerencias(["Ver movimientos", "Transferir dinero", "Consultar otra cuenta"]);
        break;

      case "cuenta_detalle":
        setSugerencias([
          "Ver saldo",
          "Ver transferencias",
          "Ver moneda de la cuenta"
        ]);
        break;

      case "tarjeta_detalle":
        setSugerencias([
          "Bloquear tarjeta",
          "Ver fecha de expiración",
          "Consultar movimientos de la tarjeta"
        ]);
        break;

      case "transferencias":
        setSugerencias([
          "Filtrar por fecha",
          "Ver transferencias mayores a ₡10 000",
          "Exportar movimientos"
        ]);
        break;

      case "seguridad":
        setSugerencias([
          "Restablecer PIN en la app",
          "Ver cómo hacerlo en ATM",
          "Revisar requisitos de seguridad"
        ]);
        break;

      default:
        setSugerencias(["Consultar saldo", "Ayuda", "Contactar soporte"]);
    }
  }

  async function manejarEnvio(texto) {
    const pregunta = texto.trim();
    if (!pregunta) return;

    // agregar mensaje del usuario
    agregarMensaje("user", pregunta);
    setEntrada("");

    // buscar en modelo local
    const contexto = buscarEnModelo(pregunta);

    // llamar a la IA (backend con OpenAI)
    const respuestaIA = await consultarIA(pregunta, contexto);

    let textoRespuesta;
    if (respuestaIA) {
      textoRespuesta = respuestaIA;
    } else {
      // fallback local para cuando no haya backend/IA
      textoRespuesta = generarRespuestaLocal(contexto, pregunta);
    }

    agregarMensaje("bot", textoRespuesta);
    generarSugerencias(contexto);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    manejarEnvio(entrada);
  };

  const handleSuggestionClick = (s) => {
    manejarEnvio(s);
  };

  return (
    <div className="chat-container">
      <h1 className="chat-title">Asistente Virtual Banco Damena</h1>

      <div className="chat-window">
        {mensajes.map((m, i) => (
          <Message key={i} sender={m.sender} text={m.text} />
        ))}
      </div>

      <Suggestions items={sugerencias} onSelect={handleSuggestionClick} />

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          type="text"
          placeholder="Escribe tu consulta aquí..."
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              // submit ya lo maneja el form
            }
          }}
        />
        <button type="submit" className="chat-send-button">
          Enviar
        </button>
      </form>
    </div>
  );
}
