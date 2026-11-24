const TOTAL = 151;
const STORAGE_KEY = "pokemonCapturados";
let pokemonCapturados = cargarCapturas();
let pokemonPendiente = null;
let lectorQR = null;

const tiposES = {
 normal:"Normal",fire:"Fuego",water:"Agua",electric:"Eléctrico",grass:"Planta",
 ice:"Hielo",fighting:"Lucha",poison:"Veneno",ground:"Tierra",flying:"Volador",
 psychic:"Psíquico",bug:"Bicho",rock:"Roca",ghost:"Fantasma",dragon:"Dragón",
 dark:"Siniestro",steel:"Acero",fairy:"Hada"
};

function cargarCapturas() {
    try {
        const datos = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

function guardarCapturas() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pokemonCapturados));
        return true;
    } catch (error) {
        mostrarToast("No se pudo guardar. Revisa el almacenamiento del navegador.");
        return false;
    }
}

function mostrarToast(mensaje) {
    const toast = document.getElementById("toast");
    toast.textContent = mensaje;
    toast.classList.add("show");
    clearTimeout(mostrarToast.timer);
    mostrarToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

async function cambiarVista(nombre) {
    await detenerCamara();
    document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
    const destino = document.getElementById(`view-${nombre}`);
    if (!destino) return;
    destino.classList.remove("hidden");
    document.querySelectorAll(".nav-button").forEach(b =>
        b.classList.toggle("active", b.dataset.view === nombre));
    document.getElementById("scan-fab").classList.toggle("hidden", nombre === "scanner" || nombre === "detail");
    if (nombre === "pokedex") renderizarPokedex();
    if (nombre === "progress") actualizarProgreso();
    window.scrollTo(0,0);
}

function renderizarPokedex() {
    const lista = document.getElementById("pokedex-list");
    const vacio = document.getElementById("empty-state");
    const sinResultados = document.getElementById("no-search-results");
    const busqueda = document.getElementById("search-pokemon").value.trim().toLowerCase();
    lista.innerHTML = "";
    vacio.classList.toggle("hidden", pokemonCapturados.length > 0);
    sinResultados.classList.add("hidden");

    for (let id=1; id<=TOTAL; id++) {
        const pokemon = pokemonCapturados.find(p => p.id === id);
        if (pokemon) {
            if (busqueda && !pokemon.name.toLowerCase().includes(busqueda) && !String(id).includes(busqueda)) continue;
            const card = document.createElement("button");
            card.type = "button";
            card.className = "pokemon-card";
            card.innerHTML = `<p class="number">#${String(id).padStart(3,"0")}</p>
                <img src="${pokemon.image}" alt="${pokemon.name}" loading="lazy">
                <p class="name">${pokemon.name}</p>
                <p class="types">${pokemon.types.map(t=>tiposES[t]||t).join(" / ")}</p>`;
            card.addEventListener("click",()=>mostrarDetalle(id));
            lista.appendChild(card);
        } else if (!busqueda) {
            const card = document.createElement("div");
            card.className = "pokemon-card locked-card";
            card.innerHTML = `<p class="number">#${String(id).padStart(3,"0")}</p>
                <div class="locked-symbol">?</div><p class="name">No descubierto</p>
                <p class="types">Pokémon bloqueado</p>`;
            lista.appendChild(card);
        }
    }
    if (busqueda && lista.children.length===0) sinResultados.classList.remove("hidden");
    actualizarProgreso();
}

function actualizarProgreso() {
    const total = pokemonCapturados.length;
    const porcentaje = (total/TOTAL*100).toFixed(1);
    const restante = TOTAL-total;
    document.getElementById("collection-count").textContent=`Pokémon capturados: ${total} de ${TOTAL}`;
    document.getElementById("collection-percent").textContent=`${porcentaje}% completado`;
    document.getElementById("collection-bar").style.width=`${porcentaje}%`;
    document.getElementById("progress-count").textContent=`Pokémon capturados: ${total} / ${TOTAL}`;
    document.getElementById("progress-percent").textContent=`Porcentaje completado: ${porcentaje}%`;
    document.getElementById("progress-bar").style.width=`${porcentaje}%`;
    document.getElementById("progress-remaining").textContent =
        restante===0 ? "¡Felicidades! Completaste la Pokédex." : `Te faltan ${restante} Pokémon.`;
}

function mostrarDetalle(id) {
    const p = pokemonCapturados.find(item=>item.id===id);
    if (!p) return;
    const tipos = p.types.map(t=>`<span class="type-tag">${tiposES[t]||t}</span>`).join("");
    document.getElementById("detail-content").innerHTML=`
        <div class="text-center">
            <p class="text-sm">#${String(p.id).padStart(3,"0")}</p>
            <h2 class="text-2xl font-bold" style="text-transform:capitalize">${p.name}</h2>
            <img class="detail-image" src="${p.image}" alt="${p.name}">
            <div>${tipos}</div>
        </div>
        <div class="mt-4 border-t pt-4">
            <p><strong>Altura:</strong> ${(p.height/10).toFixed(1)} m</p>
            <p><strong>Peso:</strong> ${(p.weight/10).toFixed(1)} kg</p>
            <p><strong>Habilidades:</strong> ${p.abilities.join(", ")||"No disponible"}</p>
            <p class="text-sm mt-2 text-gray-500">Capturado: ${new Date(p.capturedAt).toLocaleString()}</p>
        </div>`;
    document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
    document.getElementById("view-detail").classList.remove("hidden");
    document.getElementById("scan-fab").classList.add("hidden");
    document.querySelectorAll(".nav-button").forEach(b=>b.classList.remove("active"));
    window.scrollTo(0,0);
}

function validarQR(texto) {
    const match=texto.trim().match(/^pokemon:(\d+)$/i);
    if (!match) { mostrarToast("Este código QR no pertenece a la Pokédex."); return null; }
    const id=Number(match[1]);
    if (!Number.isInteger(id)||id<1||id>151) { mostrarToast("El ID debe estar entre 1 y 151."); return null; }
    return id;
}

async function buscarPokemon(id) {
    const repetido=pokemonCapturados.find(p=>p.id===id);
    if (repetido) { mostrarToast(`${repetido.name} ya se encuentra en tu Pokédex.`); return; }
    document.getElementById("scanner-message").textContent="Consultando PokéAPI...";
    mostrarToast("Consultando PokéAPI...");
    try {
        const response=await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!response.ok) throw new Error("Respuesta no válida de PokéAPI");
        const data=await response.json();
        pokemonPendiente={
            id:data.id,
            name:data.name,
            image:data.sprites.other?.["official-artwork"]?.front_default || data.sprites.front_default ||
                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
            types:data.types.map(x=>x.type.name),
            height:data.height,
            weight:data.weight,
            abilities:data.abilities.map(x=>x.ability.name),
            capturedAt:new Date().toISOString()
        };
        mostrarModal(pokemonPendiente);
    } catch(error) {
        console.error(error);
        document.getElementById("scanner-message").textContent="No se pudo consultar PokéAPI.";
        mostrarToast("Error de conexión. Revisa tu Internet e inténtalo otra vez.");
    }
}

function mostrarModal(p) {
    const tipos=p.types.map(t=>`<span class="type-tag">${tiposES[t]||t}</span>`).join("");
    document.getElementById("modal-pokemon").innerHTML=`
        <div class="text-center">
        <p>#${String(p.id).padStart(3,"0")}</p>
        <img src="${p.image}" alt="${p.name}">
        <h3 class="text-xl font-bold" style="text-transform:capitalize">${p.name}</h3>
        <div>${tipos}</div></div>`;
    document.getElementById("capture-modal").classList.remove("hidden");
}

function cerrarModal() {
    document.getElementById("capture-modal").classList.add("hidden");
    pokemonPendiente=null;
}

function confirmarCaptura() {
    if (!pokemonPendiente) return;
    if (pokemonCapturados.some(p=>p.id===pokemonPendiente.id)) {
        cerrarModal(); mostrarToast("Este Pokémon ya había sido capturado."); return;
    }
    const nuevo=pokemonPendiente;
    pokemonCapturados.push(nuevo);
    if (guardarCapturas()) {
        cerrarModal();
        renderizarPokedex();
        cambiarVista("pokedex");
        mostrarToast(`¡${nuevo.name} fue agregado a tu Pokédex!`);
    } else {
        pokemonCapturados=pokemonCapturados.filter(p=>p.id!==nuevo.id);
        cerrarModal();
    }
}

async function iniciarCamara() {
    const mensaje=document.getElementById("scanner-message");
    if (!window.isSecureContext) {
        mensaje.textContent="La cámara necesita HTTPS o localhost. Abre el proyecto con Live Server.";
        mostrarToast("La cámara necesita una conexión segura."); return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
        mensaje.textContent="Este navegador no permite acceder a la cámara."; return;
    }
    if (typeof Html5Qrcode==="undefined") {
        mensaje.textContent="No se cargó la librería QR. Revisa Internet o utiliza el campo manual."; return;
    }
    try {
        if (!lectorQR) lectorQR=new Html5Qrcode("qr-reader");
        document.getElementById("start-camera").disabled=true;
        mensaje.textContent="Solicitando permiso de cámara...";
        await lectorQR.start({facingMode:"environment"},{fps:10,qrbox:{width:220,height:220}},
            async texto=>{
                await detenerCamara();
                const id=validarQR(texto);
                if (id!==null) await buscarPokemon(id);
            },()=>{});
        document.getElementById("stop-camera").disabled=false;
        mensaje.textContent="Cámara activa. Apunta al código QR.";
    } catch(error) {
        console.error(error);
        mensaje.textContent="No se pudo iniciar la cámara. Revisa los permisos.";
        mostrarToast("No se pudo acceder a la cámara.");
        document.getElementById("start-camera").disabled=false;
    }
}

async function detenerCamara() {
    if (lectorQR && lectorQR.isScanning) {
        try { await lectorQR.stop(); lectorQR.clear(); }
        catch(error) { console.warn("No se pudo detener el lector",error); }
    }
    const start=document.getElementById("start-camera");
    const stop=document.getElementById("stop-camera");
    if(start) start.disabled=false;
    if(stop) stop.disabled=true;
}

function registrarEventos() {
    document.querySelectorAll(".nav-button").forEach(b=>b.addEventListener("click",()=>cambiarVista(b.dataset.view)));
    document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>cambiarVista(b.dataset.go)));
    document.getElementById("scan-fab").addEventListener("click",()=>cambiarVista("scanner"));
    document.getElementById("start-camera").addEventListener("click",iniciarCamara);
    document.getElementById("stop-camera").addEventListener("click",detenerCamara);
    document.getElementById("manual-qr-form").addEventListener("submit",e=>{
        e.preventDefault();
        const input=document.getElementById("manual-qr");
        const id=validarQR(input.value);
        input.value="";
        if(id!==null) buscarPokemon(id);
    });
    document.getElementById("confirm-capture").addEventListener("click",confirmarCaptura);
    document.getElementById("cancel-capture").addEventListener("click",cerrarModal);
    document.getElementById("capture-modal").addEventListener("click",e=>{
        if(e.target.id==="capture-modal") cerrarModal();
    });
    document.getElementById("search-pokemon").addEventListener("input",renderizarPokedex);
}

function registrarPWA() {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load",()=>{
            navigator.serviceWorker.register("./service-worker.js")
                .then(()=>console.log("Service Worker registrado"))
                .catch(error=>console.error("Error al registrar Service Worker",error));
        });
    }
}

document.addEventListener("DOMContentLoaded",()=>{
    registrarEventos();
    renderizarPokedex();
    actualizarProgreso();
    registrarPWA();
});
