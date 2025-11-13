import data from "../data/banco.json";

export function buscarEnModelo(pregunta) {
  const p = pregunta.toLowerCase().trim();

  // ---------------------------------------------------------------------------
  // 1. Buscar usuario por nombre (ej: "qué cuentas tiene Ana")
  // ---------------------------------------------------------------------------
  for (const u of data.usuario) {
    const nombreCompleto = `${u.nombre} ${u.apellido}`.toLowerCase();
    if (p.includes(u.nombre.toLowerCase()) || p.includes(nombreCompleto)) {
      return {
        tipo: "usuario_info",
        usuario: u,
        cuentas: data.cuenta.filter((c) => c.usuario_id === u.id),
        tarjetas: data.tarjeta.filter((t) => t.usuario_id === u.id)
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Consultar saldo (asumimos usuario u1 por simplicidad)
  // Ej: "ver saldo", "cuánto tengo", "saldo de mi cuenta"
  // ---------------------------------------------------------------------------
  if (p.includes("saldo") || p.includes("cuánto tengo") || p.includes("cuanto tengo")) {
    const cuenta = data.cuenta.find((c) => c.usuario_id === "u1");
    return {
      tipo: "saldo",
      cuenta
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Cuenta por IBAN
  // ---------------------------------------------------------------------------
  const cuentaPorIban = data.cuenta.find((c) =>
    p.includes(c.iban.toLowerCase())
  );
  if (cuentaPorIban) {
    return {
      tipo: "cuenta_detalle",
      cuenta: cuentaPorIban
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Tarjeta por últimos 4 dígitos
  // Ej: "tarjeta 4321"
  // ---------------------------------------------------------------------------
  const ultimos4 = p.match(/(\d{4})$/);
  if (ultimos4) {
    const tMatch = data.tarjeta.find((t) =>
      t.numero_enmascarado.endsWith(ultimos4[1])
    );
    if (tMatch) {
      return {
        tipo: "tarjeta_detalle",
        tarjeta: tMatch
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Transferencias / movimientos
  // ---------------------------------------------------------------------------
  if (
    p.includes("transfer") ||
    p.includes("movim") ||
    p.includes("pago") ||
    p.includes("historial")
  ) {
    return {
      tipo: "transferencias",
      transferencias: data.transferencia
    };
  }

  // ---------------------------------------------------------------------------
  // 6. Tipos de cuenta, moneda, identificación, rol
  // ---------------------------------------------------------------------------
  for (const tc of data.tipo_cuenta) {
    if (p.includes(tc.nombre.toLowerCase())) {
      return { tipo: "tipo_cuenta", tipoCuenta: tc };
    }
  }

  for (const m of data.moneda) {
    if (
      p.includes(m.iso.toLowerCase()) ||
      p.includes(m.nombre.toLowerCase())
    ) {
      return { tipo: "moneda", moneda: m };
    }
  }

  for (const tid of data.tipo_identificacion) {
    if (p.includes(tid.nombre.toLowerCase())) {
      return { tipo: "tipo_identificacion", tipoId: tid };
    }
  }

  for (const r of data.rol) {
    if (p.includes(r.nombre.toLowerCase())) {
      return { tipo: "rol", rol: r };
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Intenciones de seguridad (PIN, CVV, bloqueo)
  // ---------------------------------------------------------------------------
  if (p.includes("pin") || p.includes("cvv")) {
    return {
      tipo: "seguridad",
      mensaje:
        "Por motivos de seguridad, el Banco Damena no puede mostrar PIN ni CVV. Se puede restablecer desde la app o en un cajero automático."
    };
  }

  if (p.includes("bloquear tarjeta") || p.includes("robo") || p.includes("perdí la tarjeta")) {
    return {
      tipo: "bloqueo_tarjeta",
      mensaje:
        "Para bloquear tu tarjeta, podés hacerlo desde la app en el menú Seguridad > Bloqueo de tarjeta, o llamando a la línea de soporte 24/7."
    };
  }

  // ---------------------------------------------------------------------------
  // Nada encontrado: la IA responderá de forma general
  // ---------------------------------------------------------------------------
  return null;
}
