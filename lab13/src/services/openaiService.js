export async function consultarIA(pregunta, contexto) {
  try {
    const res = await fetch("http://localhost:3000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pregunta,
        contexto
      })
    });

    if (!res.ok) {
      console.error("Error HTTP al llamar a la IA:", res.status);
      return null;
    }

    const data = await res.json();
    // Esperamos que el backend responda { respuesta: "texto..." }
    return data.respuesta || null;
  } catch (error) {
    console.error("Error al conectar con la IA:", error);
    return null;
  }
}
