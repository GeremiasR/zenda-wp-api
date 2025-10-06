User:
-id
-username
-email
-shopId
-password
-roleCode
-isActive
-createdAt
-updatedAt

Role:
-id
-isActive
-code // "ADMIN", "SHOPADMIN", "SHOPBOUSER", "CUSTOMER"
-label // "Administrador", "Shop Admin", etc

Shop:
-id
-name
-isActive
-internalName

MessageSession:
-id
-shopId
-from
-to
-flowId
-currentState //del flow

Flow:
-id
-name
-description
-phoneNumber
-shopId
-createdAt
-updatedAt
-isActive
-isDeleted
-initialState
-states

Ejemplo de initialState y states

{
....other properties,
"initialState": "menu",
"states": {
"menu": {
"message": "Bienvenida/o 👋, elige una opción:\n1) Solicitar turno\n2) Alquilar máquina\n3) Servicios\n4) Productos\n5) Contacto",
"options": [
{ "input": ["1", "turno", "reserva"], "event": "TURNO", "next": "solicitar_turno" },
{ "input": ["2", "maquina", "alquilar"], "event": "MAQUINA", "next": "alquilar_maquina" },
{ "input": ["3", "servicio"], "event": "SERVICIOS", "next": "servicios" },
{ "input": ["4", "producto"], "event": "PRODUCTOS", "next": "productos" },
{ "input": ["5", "contacto"], "event": "CONTACTO", "next": "contacto" }
]
},

    "solicitar_turno": {
      "message": "📅 ¿Qué día te gustaría reservar el turno?",
      "options": [
        { "input": ["back"], "event": "BACK", "next": "menu" },
        { "input": ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado"], "event": "FECHA", "next": "confirmar_turno" }
      ]
    },
    "confirmar_turno": {
      "message": "Perfecto 🙌, reservamos tu turno ese día. ¿Quieres confirmar? (si/no)",
      "options": [
        { "input": ["si", "confirmar"], "event": "CONFIRMAR", "next": "turno_confirmado" },
        { "input": ["no"], "event": "CANCELAR", "next": "menu" }
      ]
    },
    "turno_confirmado": {
      "message": "✅ ¡Tu turno quedó confirmado! Muchas gracias 💆‍♀️",
      "options": [{ "input": ["menu", "volver"], "event": "BACK", "next": "menu" }]
    },

    "alquilar_maquina": {
      "message": "💻 ¿Qué máquina deseas alquilar?\n- Presoterapia\n- Cavitación\n- Radiofrecuencia",
      "options": [
        { "input": ["presoterapia"], "event": "MAQUINA_PRESO", "next": "confirmar_alquiler" },
        { "input": ["cavitación"], "event": "MAQUINA_CAVI", "next": "confirmar_alquiler" },
        { "input": ["radiofrecuencia"], "event": "MAQUINA_RADIO", "next": "confirmar_alquiler" },
        { "input": ["back"], "event": "BACK", "next": "menu" }
      ]
    },
    "confirmar_alquiler": {
      "message": "👌 Excelente elección. ¿Quieres confirmar el alquiler? (si/no)",
      "options": [
        { "input": ["si"], "event": "CONFIRMAR", "next": "alquiler_confirmado" },
        { "input": ["no"], "event": "CANCELAR", "next": "menu" }
      ]
    },
    "alquiler_confirmado": {
      "message": "✅ ¡Alquiler confirmado! Gracias por tu confianza.",
      "options": [{ "input": ["menu"], "event": "BACK", "next": "menu" }]
    },

    "servicios": {
      "message": "Nuestros servicios son:\n✨ Depilación\n✨ Masajes\n✨ Tratamientos faciales\n¿Quieres info de alguno?",
      "options": [
        { "input": ["depilación"], "event": "SERV_DEPILACION", "next": "detalle_servicio" },
        { "input": ["masajes"], "event": "SERV_MASAJES", "next": "detalle_servicio" },
        { "input": ["faciales"], "event": "SERV_FACIALES", "next": "detalle_servicio" },
        { "input": ["back"], "event": "BACK", "next": "menu" }
      ]
    },
    "detalle_servicio": {
      "message": "📖 Aquí tienes el detalle del servicio seleccionado. ¿Quieres reservar un turno? (si/no)",
      "options": [
        { "input": ["si"], "event": "RESERVAR", "next": "solicitar_turno" },
        { "input": ["no"], "event": "CANCELAR", "next": "menu" }
      ]
    },

    "productos": {
      "message": "Tenemos disponibles:\n🧴 Cremas\n🌿 Aceites\n🎁 Packs promocionales\n¿Quieres ver el catálogo online?",
      "options": [
        { "input": ["si", "catalogo"], "event": "CATALOGO", "next": "link_catalogo" },
        { "input": ["back"], "event": "BACK", "next": "menu" }
      ]
    },
    "link_catalogo": {
      "message": "Aquí tienes el catálogo: https://mieshop.com/catalogo 📲",
      "options": [{ "input": ["menu"], "event": "BACK", "next": "menu" }]
    },

    "contacto": {
      "message": "☎️ Puedes comunicarte con nosotros:\n- WhatsApp directo\n- Llamada\n- Visítanos en el local.\n¿Quieres que te contacte una persona?",
      "options": [
        { "input": ["si", "humano", "asesor"], "event": "HUMANO", "next": "contacto_humano" },
        { "input": ["no", "menu"], "event": "BACK", "next": "menu" }
      ]
    },
    "contacto_humano": {
      "message": "Un asesor se pondrá en contacto contigo en breve 🙋‍♀️",
      "options": [{ "input": ["menu"], "event": "BACK", "next": "menu" }]
    }

}
}
