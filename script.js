if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
}

// --- Éléments du DOM ---
const input = document.querySelector("input")
const boutons = document.querySelector(".boutons")
const btnFavoris = document.querySelector("#btn-favoris")
const btnTous = document.querySelector("#btn-Tous")
const overlay = document.querySelector(".overlay")
const zonePhoto = document.querySelector("#zone-photo")
const inputPhoto = document.querySelector("#input-photo")

// --- Données ---
const recettesParDefaut = [
    { id: 1, titre: "Pâtes Bolognaises", temps: "1h30", etoiles: "★★★★☆", tags: '<span class="tag-italien">Italien</span>', photo: "https://s1.qwant.com/thumbr/474x355/8/6/4dcbc871b87f0214f82764da753a23f4588f37da0e33d8e86aee239e05139e/OIP.hYbhTMTE7ZEIsp1dU75oSAHaFj.jpg?u=https%3A%2F%2Fthf.bing.com%2Fth%2Fid%2FOIP.hYbhTMTE7ZEIsp1dU75oSAHaFj%3Fcb%3Dthfc1falcon3%26pid%3DApi&q=0&b=1&p=0&a=0", favori: false },
    { id: 2, titre: "Tartiflette", temps: "1h15", etoiles: "★★★☆☆", tags: '<span class="tag-facile">Facile</span>', photo: "https://s1.qwant.com/thumbr/474x315/0/1/6fd6706f769f4982aa894949b1c8587342cc229ad9caaa968cac86a69f63ec/OIP.57RNdeTqS5h3CVnP85T3VwHaE7.jpg?u=https%3A%2F%2Ftse.mm.bing.net%2Fth%2Fid%2FOIP.57RNdeTqS5h3CVnP85T3VwHaE7%3Fpid%3DApi&q=0&b=1&p=0&a=0", favori: false },
    { id: 3, titre: "Pâtes Carbonara", temps: "12min", etoiles: "★★★★★", tags: '<span class="tag-italien">Italien</span>', photo: "https://s1.qwant.com/thumbr/474x273/2/b/ad6a354865d45ee3fa533f9638088ef1e42d8216edb5c09543f2750e106d0b/OIP.oPqTM0j-aAO7lOEwdI2IMAHaER.jpg?u=https%3A%2F%2Fthf.bing.com%2Fth%2Fid%2FOIP.oPqTM0j-aAO7lOEwdI2IMAHaER%3Fcb%3Dthfc1falcon3%26pid%3DApi&q=0&b=1&p=0&a=0", favori: false },
]

let recettesSauvegardees = JSON.parse(localStorage.getItem("recettes")) || recettesParDefaut
let carteEnEdition = null
let photoURL = null

// --- Sauvegarde ---
function sauvegarderRecettes() {
    localStorage.setItem("recettes", JSON.stringify(recettesSauvegardees))
}

// --- Filtres ---
function desactiverFiltres() {
    document.querySelectorAll(".boutons button").forEach(function(f) {
        f.classList.remove("filtre-actif")
    })
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
    if (!data.id) data.id = Date.now() + Math.random()
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

    carte.querySelector(".coeur button").addEventListener("click", function(e) {
        e.stopPropagation()
        this.classList.toggle("actif")
        data.favori = this.classList.contains("actif")
        sauvegarderRecettes()
        mettreAJourBadges()
    })

    carte.addEventListener("click", function() {
        ouvrirEdition(carte)
    })

    carte.dataset.id = data.id
    document.querySelector(".recettes").appendChild(carte)
    return carte
}

// --- Chargement initial ---
recettesSauvegardees.forEach(function(data) {
    creerCarteRecette(data)
})
mettreAJourBadges()

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

// --- Ouvrir/fermer formulaire ---
document.querySelector(".btn-ajouter").addEventListener("click", function() {
    carteEnEdition = null
    document.querySelector(".btn-supprimer-recette").style.display = "none"
    overlay.style.display = "flex"
})

document.querySelector(".btn-fermer").addEventListener("click", function() {
    overlay.style.display = "none"
})

document.querySelector(".btn-Annuler").addEventListener("click", function() {
    overlay.style.display = "none"
})

// --- Photo ---
zonePhoto.addEventListener("click", function() {
    document.querySelector("#input-photo").click()
})

inputPhoto.addEventListener("change", function() {
    const fichier = inputPhoto.files[0]
    if (fichier) {
        photoURL = URL.createObjectURL(fichier)
        zonePhoto.innerHTML = `<img src="${photoURL}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;">`
    }
})

// --- Ouvrir en édition ---
function ouvrirEdition(carte) {
    carteEnEdition = carte
    const id = carte.dataset.id
    const data = recettesSauvegardees.find(function(r) { return String(r.id) === String(id) })
    if (!data) return

    document.querySelector(".formulaire input[type='text']").value = data.titre

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

    if (data.photo) {
        photoURL = data.photo
        zonePhoto.innerHTML = `<img src="${data.photo}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;">`
    }

    document.querySelector(".btn-supprimer-recette").style.display = "block"
    overlay.style.display = "flex"
}


document.querySelector(".btn-supprimer-recette").addEventListener("click", function() {
    if (!carteEnEdition) return
    const id = carteEnEdition.dataset.id
    recettesSauvegardees = recettesSauvegardees.filter(function(r) { return String(r.id) !== String(id) })
    sauvegarderRecettes()
    carteEnEdition.remove()
    carteEnEdition = null
    resetFormulaire()
    mettreAJourBadges()
    overlay.style.display = "none"
})

// --- Reset formulaire ---
function resetFormulaire() {
    document.querySelector(".formulaire input[type='text']").value = ""
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
    zonePhoto.innerHTML = `<span>🖼️</span><p>Cliquez pour ajouter une photo</p><p class="sous-label">JPG ou PNG</p><input type="file" accept="image/*" id="input-photo" style="display:none">`
    document.querySelector("#input-photo").addEventListener("change", function() {
        const fichier = this.files[0]
        if (fichier) {
            photoURL = URL.createObjectURL(fichier)
            zonePhoto.innerHTML = `<img src="${photoURL}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;">`
        }
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
document.querySelector(".btn-Ajouter-recette").addEventListener("click", function() {
    const titre = document.querySelector(".formulaire input[type='text']").value
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

    const data = { titre, temps: tempsTotal, etoiles: etoilesHTML, tags: tagsHTML, photo: photoURL, favori: false }

    if (carteEnEdition) {
        data.id = carteEnEdition.dataset.id
        const index = recettesSauvegardees.findIndex(function(r) { return String(r.id) === String(data.id) })
        if (index !== -1) recettesSauvegardees[index] = data
        carteEnEdition.querySelector("h2").textContent = titre
        if (tagsHTML) carteEnEdition.querySelector(".tags").innerHTML = tagsHTML
        carteEnEdition.querySelector(".recette-info p").innerHTML = (tempsTotal ? "⏱ " + tempsTotal + " · " : "") + "<span class='etoiles'>" + etoilesHTML + "</span>"
        if (photoURL) {
            const oldPhoto = carteEnEdition.querySelector("img") || carteEnEdition.querySelector(".photo-placeholder")
            if (oldPhoto) oldPhoto.outerHTML = `<img src="${photoURL}" alt="${titre}">`
        }
        carteEnEdition = null
    } else {
        recettesSauvegardees.push(data)
        creerCarteRecette(data)
    }

    sauvegarderRecettes()
    resetFormulaire()
    mettreAJourBadges()
    overlay.style.display = "none"
})
