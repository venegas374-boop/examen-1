import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

// Llena el <select> con createElement (sin innerHTML)
const cargarCategorias = async () => {
  try {
    const { data } = await listarCategorias();
    for (const categoria of data) {
      const $opcion = document.createElement("option");
      $opcion.value = categoria.id;
      $opcion.textContent = categoria.nombre;
      $selectCategoria.append($opcion);
    }
  } catch {
    mostrarMensaje("error", "No fue posible cargar las categorías.");
  }
};

const limpiarErrores = () => {
  $form.querySelectorAll("[data-error]").forEach(($p) => ($p.textContent = ""));
  $form.querySelectorAll("[aria-invalid]").forEach(($campo) => $campo.removeAttribute("aria-invalid"));
};

const aNumero = (valor) => (valor === "" ? null : Number(valor));

const mostrarErrores = (errores) => {
  for (const [campo, [mensaje]] of Object.entries(errores)) {
    const $error = $form.querySelector(`[data-error="${campo}"]`);
    if ($error) $error.textContent = mensaje;
    $form.elements[campo]?.setAttribute("aria-invalid", "true");
  }
};

/**
 * TODO [F3] Formulario de registro de equipos.
 *
 * iniciarFormulario({ alGuardar }):
 *  1. Llene el <select id="categoria_id"> con listarCategorias()
 *     (cree cada <option> con createElement, value = id, texto = nombre).
 *  2. Al enviar el formulario (submit):
 *     - Evite el envío tradicional.
 *     - Limpie los errores anteriores: textContent de [data-error] y aria-invalid de los campos.
 *     - Construya el objeto con FormData. categoria_id y costo_interno deben ir como números.
 *     - Deshabilite #btn-guardar y cambie su texto a "Guardando…" mientras espera.
 *     - Llame a crearEquipo(datos).
 *     - Éxito: limpie el formulario, mostrarMensaje("exito", "Equipo <codigo> registrado.")
 *              y llame a alGuardar().
 *     - 422: por cada campo de error.datos.errors, escriba el PRIMER mensaje en
 *            el <p data-error="<campo>"> y marque el campo con aria-invalid="true".
 *     - Otro error: mostrarMensaje("error", ...).
 *     - Siempre (finally): rehabilite el botón y restaure su texto.
 */
export const iniciarFormulario = ({ alGuardar }) => {
  cargarCategorias();

  $form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limpiarErrores();

    const datos = Object.fromEntries(new FormData($form));
    datos.categoria_id = aNumero(datos.categoria_id);
    datos.costo_interno = aNumero(datos.costo_interno);

    const textoOriginal = $btnGuardar.textContent;
    $btnGuardar.disabled = true;
    $btnGuardar.textContent = "Guardando…";

    try {
      const { data } = await crearEquipo(datos);
      $form.reset();
      mostrarMensaje("exito", `Equipo ${data.codigo} registrado.`);
      alGuardar();
    } catch (error) {
      if (error.status === 422) {
        mostrarErrores(error.datos.errors ?? {});
      } else {
        mostrarMensaje("error", "No fue posible registrar el equipo.");
      }
    } finally {
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = textoOriginal;
    }
  });
};