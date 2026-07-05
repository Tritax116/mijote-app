if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
}

// --- Supabase ---
const SUPABASE_URL = "https://bqavrjgcemfxduzwfzqo.supabase.co"
const SUPABASE_KEY = "sb_publishable_UQtTGdP2NXrY5J0uvvcXPg_1VVYqEaz"
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// --- Éléments du DOM ---
const input = document.querySelector("input")
const boutons = document.querySelector(".boutons")
const btnFavoris = document.querySelector("#btn-favoris")
const btnTous = document.querySelector("#btn-Tous")
const overlay = document.querySelector(".overlay")
const zonePhoto = document.querySelector("#zone-photo")
const inputPhoto = document.querySelector("#input-photo")

// --- Données ---
let recettesSauvegardees = []
let carteEnEdition = null
let photoURL = null       // URL utilisée pour la prévisualisation (blob temporaire ou URL déjà en ligne)
let photoFichier = null   // Fichier en attente d'upload vers Supabase Storage

// --- Chargement depuis Supabase ---
async function chargerRecettes() {
    const { data, error } = await supabaseClient
        .from("recettes")
        .select("*")
        .order("created_at", { ascending: true })

    if (error) {
        console.error("Erreur de chargement des recettes :", error)
        return
    }

    recettesSauvegardees = data.map(function(r) {
        return {
            id: r.id,
            titre: r.titre,
            temps: r.temps,
            etoiles: r.etoiles,
            tags: r.tags,
            photo: r.photo_url,
            favori: r.favori
        }
    })

    document.querySelector(".recettes").innerHTML = ""
    recettesSauvegardees.forEach(function(data) {
        creerCarteRecette(data)
    })
    mettreAJourBadges()
}

// --- Upload d'une photo vers Supabase Storage ---
async function uploaderPhoto(fichier) {
    const nomFichier = `${Date.now()}-${fichier.name}`
    const { error } = await supabaseClient.storage.from("photos").upload(nomFichier, fichier)
    if (error) {
        console.error("Erreur upload photo :", error)
        return null
    }
    const { data } = supabaseClient.storage.from("photos").getPublicUrl(nomFichier)
    return data.publicUrl
}

// --- Filtres ---
function desactiverFiltres() {
    document.querySelectorAll(".boutons button").forEach(function(f) {
        f.classList.remove("filtre-actif")
    })
    const messageVide = document.querySelector("#message-vide")
    if (messageVide) messageVide.remove()
}

function mettreAJourFiltres() {
    document.querySelectorAll(".boutons .filtre-dynamique").forEach(function(b) { b.remove() })

    const tags = {}
    recettesSauvegardees.forEach(function(data) {
        const div = document.createElement("div")
        div.innerHTML = data.tags
        div.querySelectorAll("span").forEach(function(span) {
            const texte = span.textContent.trim()
            if (texte) tags[texte] = (tags[texte] || 0) + 1
        })
    })

    Object.keys(tags).forEach(function(tag) {
        const btn = document.createElement("button")
        btn.classList.add("filtre-dynamique")
        btn.innerHTML = `${tag} <span class="badge">${tags[tag]}</span>`
        btn.addEventListener("click", function() {
            desactiverFiltres()
            btn.classList.add("filtre-actif")
            document.querySelectorAll(".recette").forEach(function(recette) {
                const carte = recettesSauvegardees.find(function(r) { return String(r.id) === String(recette.dataset.id) })
                recette.style.display = (carte && carte.tags && carte.tags.includes(tag)) ? "block" : "none"
            })
        })
        boutons.appendChild(btn)
    })
}

function mettreAJourBadges() {
    document.querySelector("#btn-Tous .badge").textContent = document.querySelectorAll(".recette").length
    document.querySelector("#btn-favoris .badge").textContent = document.querySelectorAll(".coeur button.actif").length
    mettreAJourFiltres()
}

// --- Créer une carte ---
function creerCarteRecette(data) {
    const photoHTML = data.photo
        ? `<img src="${data.photo}" alt="${data.titre}">`
        : `<div class="photo-placeholder"><span class="initiale">${data.titre[0].toUpperCase()}</span></div>`

    const carte = document.createElement("div")
    carte.classList.add("recette")
    carte.innerHTML = `
        <div class="coeur"><button class="${data.favori ? "actif" : ""}">♡</button></div>
        ${photoHTML}
        <h2>${data.titre}</h2>
        <div class="recette-info">
            <p>${data.temps ? "⏱ " + data.temps + " · " : ""}<span class="etoiles">${data.etoiles}</span></p>
        </div>
        <div class="tags">${data.tags}</div>
    `

    carte.querySelector(".coeur button").addEventListener("click", async function(e) {
        e.stopPropagation()
        this.classList.toggle("actif")
        data.favori = this.classList.contains("actif")
        mettreAJourBadges()

        const { error } = await supabaseClient
            .from("recettes")
            .update({ favori: data.favori })
            .eq("id", data.id)
        if (error) console.error("Erreur mise à jour favori :", error)
    })

    carte.addEventListener("click", function() {
        ouvrirEdition(carte)
    })

    carte.dataset.id = data.id
    document.querySelector(".recettes").appendChild(carte)
    return carte
}

// --- Chargement initial ---
chargerRecettes()

// --- Recherche ---
function filtrerRecettes() {
    const texte = input.value.toLowerCase()
    document.querySelectorAll(".recette").forEach(function(recette) {
        const nom = recette.querySelector("h2").textContent.toLowerCase()
        recette.style.display = nom.includes(texte) ? "block" : "none"
    })
}


input.addEventListener("input", filtrerRecettes)
input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") filtrerRecettes()
})

// --- Filtres Tous et Favoris ---
btnTous.addEventListener("click", function() {
    desactiverFiltres()
    const messageVide = document.querySelector("#message-Vide")
    if (messageVide) messageVide.remove()
    btnTous.classList.add("filtre-actif")
    document.querySelectorAll(".recette").forEach(function(r) { r.style.display = "block" })
})

btnFavoris.addEventListener("click", function() {
    desactiverFiltres()
    btnFavoris.classList.add("filtre-actif")
    document.querySelectorAll(".recette").forEach(function(recette) {
        const coeur = recette.querySelector(".coeur button")
        recette.style.display = coeur.classList.contains("actif") ? "block" : "none"
    })

    const visibles = document.querySelectorAll(".recette[style*='block']").length
    if (visibles === 0) {
        const message = document.createElement("p")
        message.id = "message-vide"
        message.textContent = "Aucun favori pour l'instant ♡"
        document.querySelector(".recettes").appendChild(message)
    }
})

// --- Difficulté du formulaire ---
document.querySelectorAll(".difficulte button").forEach(function(btn) {
    btn.addEventListener("click", function() {
        document.querySelectorAll(".difficulte button").forEach(function(b) {
            b.classList.remove("difficulte-active")
        })
        btn.classList.add("difficulte-active")
    })
})

// --- Étoiles du formulaire ---
const etoilesForm = document.querySelectorAll(".étoile")

etoilesForm.forEach(function(etoile, index) {
    etoile.addEventListener("click", function(e) {
        const rect = etoile.getBoundingClientRect()
        const demi = (e.clientX - rect.left) < rect.width / 2
        const valeur = demi ? index + 0.5 : index + 1

        etoilesForm.forEach(function(e, i) {
            e.classList.remove("actif", "demi")
            if (i < Math.floor(valeur)) {
                e.classList.add("actif")
            } else if (i === Math.floor(valeur) && valeur % 1 !== 0) {
                e.classList.add("demi")
            }
        })
    })
})

// --- Catégories du formulaire ---
document.querySelectorAll(".categories button").forEach(function(btn) {
    btn.addEventListener("click", function() {
        btn.classList.toggle("categorie-active")
    })
})

// --- Validation titre ---
const inputTitre = document.querySelector("#input-titre")
const btnAjouter = document.querySelector(".btn-Ajouter-recette")

function mettreAJourBoutonAjouter() {
    const vide = inputTitre.value.trim() === ""
    btnAjouter.classList.toggle("btn-desactive", vide)
}

inputTitre.addEventListener("input", mettreAJourBoutonAjouter)

// --- Ouvrir/fermer formulaire ---
document.querySelector(".btn-ajouter").addEventListener("click", function() {
    carteEnEdition = null
    document.querySelector(".btn-supprimer-recette").style.display = "none"
    overlay.style.display = "flex"
    mettreAJourBoutonAjouter()
})

document.querySelector(".btn-fermer").addEventListener("click", function() {
    overlay.style.display = "none"
})

document.querySelector(".btn-Annuler").addEventListener("click", function() {
    overlay.style.display = "none"
})

// --- Photo ---
function gererSelectionPhoto(fichier) {
    if (!fichier) return
    photoFichier = fichier
    photoURL = URL.createObjectURL(fichier) // uniquement pour la prévisualisation immédiate
    zonePhoto.innerHTML = `<img src="${photoURL}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;">`
}

zonePhoto.addEventListener("click", function() {
    document.querySelector("#input-photo").click()
})

inputPhoto.addEventListener("change", function() {
    gererSelectionPhoto(inputPhoto.files[0])
})

// --- Ouvrir en édition ---
function ouvrirEdition(carte) {
    carteEnEdition = carte
    const id = carte.dataset.id
    const data = recettesSauvegardees.find(function(r) { return String(r.id) === String(id) })
    if (!data) return

    inputTitre.value = data.titre

    const tempsInputs = document.querySelectorAll(".temps input")
    if (data.temps) tempsInputs[0].value = parseInt(data.temps) || ""

    document.querySelectorAll(".categories button").forEach(function(btn) {
        btn.classList.remove("categorie-active")
        if (data.tags && data.tags.includes(btn.textContent)) btn.classList.add("categorie-active")
    })

    document.querySelectorAll(".difficulte button").forEach(function(btn) {
        btn.classList.remove("difficulte-active")
        if (data.tags && data.tags.includes(btn.textContent)) btn.classList.add("difficulte-active")
    })

    const etoilesCount = (data.etoiles.match(/★/g) || []).length
    document.querySelectorAll(".étoile").forEach(function(e, i) {
        e.classList.remove("actif", "demi")
        if (i < etoilesCount) e.classList.add("actif")
    })

    photoFichier = null // pas de nouveau fichier tant que l'utilisateur n'en choisit pas un
    if (data.photo) {
        photoURL = data.photo
        zonePhoto.innerHTML = `<img src="${data.photo}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;">`
    } else {
        photoURL = null
    }

    document.querySelector(".btn-supprimer-recette").style.display = "block"
    overlay.style.display = "flex"
    mettreAJourBoutonAjouter()
}


document.querySelector(".btn-supprimer-recette").addEventListener("click", async function() {
    if (!carteEnEdition) return
    const id = carteEnEdition.dataset.id

    const { error } = await supabaseClient.from("recettes").delete().eq("id", id)
    if (error) {
        console.error("Erreur suppression :", error)
        return
    }

    recettesSauvegardees = recettesSauvegardees.filter(function(r) { return String(r.id) !== String(id) })
    carteEnEdition.remove()
    carteEnEdition = null
    resetFormulaire()
    mettreAJourBadges()
    overlay.style.display = "none"
})

// --- Reset formulaire ---
function resetFormulaire() {
    inputTitre.value = ""
    document.querySelectorAll(".temps input").forEach(function(i) { i.value = "" })
    document.querySelector(".note textarea").value = ""
    document.querySelectorAll(".categories button").forEach(function(b) { b.classList.remove("categorie-active") })
    document.querySelectorAll(".difficulte button").forEach(function(b) { b.classList.remove("difficulte-active") })
    document.querySelectorAll(".étoile").forEach(function(e) { e.classList.remove("actif", "demi") })
    document.querySelectorAll(".ligne-ingredient").forEach(function(l, i) { if (i > 0) l.remove() })
    document.querySelector("#input-qte").value = ""
    document.querySelector("#input-unite").value = ""
    document.querySelector("#input-ingredient").value = ""
    document.querySelectorAll(".ligne-etape").forEach(function(e, i) { if (i > 0) e.remove() })
    document.querySelector(".ligne-etape textarea").value = ""
    photoURL = null
    photoFichier = null
    zonePhoto.innerHTML = `<span>🖼️</span><p>Cliquez pour ajouter une photo</p><p class="sous-label">JPG ou PNG</p><input type="file" accept="image/*" id="input-photo" style="display:none">`
    document.querySelector("#input-photo").addEventListener("change", function() {
        gererSelectionPhoto(this.files[0])
    })
}

// --- Ingrédients dynamiques ---
document.querySelector("#btn-supprimer-ingredient").addEventListener("click", function() {
    document.querySelector("#input-qte").value = ""
    document.querySelector("#input-unite").value = ""
    document.querySelector("#input-ingredient").value = ""
})

document.querySelector(".btn-ajouter-ingredient").addEventListener("click", function() {
    const nouvelleLigne = document.createElement("div")
    nouvelleLigne.classList.add("ligne-ingredient")
    nouvelleLigne.innerHTML = `
        <input type="text" placeholder="Qté">
        <input type="text" placeholder="Unité">
        <input type="text" placeholder="Ingrédient">
        <button class="btn-supprimer-ligne">×</button>
    `
    document.querySelector(".btn-ajouter-ingredient").before(nouvelleLigne)
    nouvelleLigne.querySelector(".btn-supprimer-ligne").addEventListener("click", function() {
        nouvelleLigne.remove()
    })
})

// --- Étapes dynamiques ---
document.querySelector(".btn-ajouter-etape").addEventListener("click", function() {
    const numero = document.querySelectorAll(".ligne-etape").length + 1
    const nouvelleEtape = document.createElement("div")
    nouvelleEtape.classList.add("ligne-etape")
    nouvelleEtape.innerHTML = `
        <span class="numero-etape">${numero}</span>
        <textarea placeholder="Décrivez cette étape..."></textarea>
        <button class="btn-supprimer-etape">×</button>
    `
    document.querySelector(".btn-ajouter-etape").before(nouvelleEtape)
    nouvelleEtape.querySelector(".btn-supprimer-etape").addEventListener("click", function() {
        nouvelleEtape.remove()
        document.querySelectorAll(".ligne-etape").forEach(function(etape, index) {
            etape.querySelector(".numero-etape").textContent = index + 1
        })
    })
})

// --- Ajouter / modifier une recette ---
document.querySelector(".btn-Ajouter-recette").addEventListener("click", async function() {
    const titre = inputTitre.value
    if (!titre) return

    const tempsInputs = document.querySelectorAll(".temps input")
    const prepa = tempsInputs[0].value
    const cuisson = tempsInputs[1].value
    const tempsTotal = prepa && cuisson ? parseInt(prepa) + parseInt(cuisson) + "min" : prepa ? prepa + "min" : cuisson ? cuisson + "min" : ""

    let tagsHTML = ""
    document.querySelectorAll(".categories button.categorie-active").forEach(function(btn) {
        tagsHTML += `<span class="tag-italien">${btn.textContent}</span>`
    })

    const difficulteBouton = document.querySelector(".difficulte button.difficulte-active")
    if (difficulteBouton) {
        tagsHTML += `<span class="tag-facile">${difficulteBouton.textContent}</span>`
    }

    const etoilesActives = document.querySelectorAll(".étoile.actif").length
    const etoilesDemi = document.querySelectorAll(".étoile.demi").length
    let etoilesHTML = ""
    for (let i = 0; i < 5; i++) {
        if (i < etoilesActives) etoilesHTML += "★"
        else if (i === etoilesActives && etoilesDemi) etoilesHTML += "★"
        else etoilesHTML += "☆"
    }

    // Upload de la photo si un nouveau fichier a été choisi
    let photoUrlFinale = (carteEnEdition && !photoFichier) ? photoURL : null
    if (photoFichier) {
        btnAjouter.textContent = "Envoi de la photo..."
        btnAjouter.disabled = true
        const urlUploadee = await uploaderPhoto(photoFichier)
        btnAjouter.disabled = false
        btnAjouter.textContent = carteEnEdition ? "Enregistrer" : "Ajouter la recette"
        if (urlUploadee) photoUrlFinale = urlUploadee
    }

    if (carteEnEdition) {
        const id = carteEnEdition.dataset.id
        const { error } = await supabaseClient
            .from("recettes")
            .update({
                titre,
                temps: tempsTotal,
                etoiles: etoilesHTML,
                tags: tagsHTML,
                photo_url: photoUrlFinale
            })
            .eq("id", id)

        if (error) {
            console.error("Erreur modification recette :", error)
            return
        }

        const index = recettesSauvegardees.findIndex(function(r) { return String(r.id) === String(id) })
        if (index !== -1) {
            recettesSauvegardees[index] = {
                id,
                titre,
                temps: tempsTotal,
                etoiles: etoilesHTML,
                tags: tagsHTML,
                photo: photoUrlFinale,
                favori: recettesSauvegardees[index].favori
            }
        }

        carteEnEdition.querySelector("h2").textContent = titre
        if (tagsHTML) carteEnEdition.querySelector(".tags").innerHTML = tagsHTML
        carteEnEdition.querySelector(".recette-info p").innerHTML = (tempsTotal ? "⏱ " + tempsTotal + " · " : "") + "<span class='etoiles'>" + etoilesHTML + "</span>"
        if (photoUrlFinale) {
            const oldPhoto = carteEnEdition.querySelector("img") || carteEnEdition.querySelector(".photo-placeholder")
            if (oldPhoto) oldPhoto.outerHTML = `<img src="${photoUrlFinale}" alt="${titre}">`
        }
        carteEnEdition = null
    } else {
        const { data, error } = await supabaseClient
            .from("recettes")
            .insert({
                titre,
                temps: tempsTotal,
                etoiles: etoilesHTML,
                tags: tagsHTML,
                photo_url: photoUrlFinale,
                favori: false
            })
            .select()
            .single()

        if (error) {
            console.error("Erreur ajout recette :", error)
            return
        }

        const nouvelleRecette = {
            id: data.id,
            titre,
            temps: tempsTotal,
            etoiles: etoilesHTML,
            tags: tagsHTML,
            photo: photoUrlFinale,
            favori: false
        }
        recettesSauvegardees.push(nouvelleRecette)
        creerCarteRecette(nouvelleRecette)
    }

    resetFormulaire()
    mettreAJou