if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js")
}

const input = document.querySelector("input")

const recettesParDefaut = [
    { id: 1, titre: "Pates Bolognaises", temps: "1h30", etoiles: "★★★★☆", tags: '<span class="tag-italien">Italien</span>', photo: "https://s1.qwant.com/thumbr/474x355/8/6/4dcbc871b87f0214f82764da753a23f4588f37da0e33d8e86aee239e05139e/OIP.hYbhTMTE7ZEIsp1dU75oSAHaFj.jpg?u=https%3A%2F%2Fthf.bing.com%2Fth%2Fid%2FOIP.hYbhTMTE7ZEIsp1dU75oSAHaFj%3Fcb%3Dthfc1falcon3%26pid%3DApi&q=0&b=1&p=0&a=0", favori: false },
    { id: 2, titre: "Tartiflette", temps: "1h15", etoiles: "★★★☆☆", tags: '<span class="tag-facile">Facile</span>', photo: "https://s1.qwant.com/thumbr/474x315/0/1/6fd6706f769f4982aa894949b1c8587342cc229ad9caaa968cac86a69f63ec/OIP.57RNdeTqS5h3CVnP85T3VwHaE7.jpg?u=https%3A%2F%2Ftse.mm.bing.net%2Fth%2Fid%2FOIP.57RNdeTqS5h3CVnP85T3VwHaE7%3Fpid%3DApi&q=0&b=1&p=0&a=0", favori: false },
    { id: 3, titre: "Pates Carbonnara", temps: "12min", etoiles: "★★★★★", tags: '<span class="tag-italien">Italien</span>', photo: "https://s1.qwant.com/thumbr/474x273/2/b/ad6a354865d45ee3fa533f9638088ef1e42d8216edb5c09543f2750e106d0b/OIP.oPqTM0j-aAO7lOEwdI2IMAHaER.jpg?u=https%3A%2F%2Fthf.bing.com%2Fth%2Fid%2FOIP.oPqTM0j-aAO7lOEwdI2IMAHaER%3Fcb%3Dthfc1falcon3%26pid%3DApi&q=0&b=1&p=0&a=0", favori: false },
]

let recettesSauvegardees = JSON.parse(localStorage.getItem("recettes")) || recettesParDefaut

function sauvegarderRecettes() {
    localStorage.setItem("recettes", JSON.stringify(recettesSauvegardees))
}

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
    })

    carte.addEventListener("click", function() {
        ouvrirEdition(carte)
    })

    carte.dataset.id = data.id
    document.querySelector(".recettes").appendChild(carte)
    return carte
}

recettesSauvegardees.forEach(function(data) {
    creerCarteRecette(data)
})

function filtrerRecettes() {
    const texte = input.value.toLowerCase()
    const recettes = document.querySelectorAll(".recette")

    recettes.forEach(function(recette) {
        const nom = recette.querySelector("h2").textContent.toLowerCase()
        if (nom.includes(texte)) {
            recette.style.display = "block"
        } else {
            recette.style.display = "none"
        }
    })
}

input.addEventListener("input", filtrerRecettes)

input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        filtrerRecettes()
    }
})

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

const btnCategories = document.querySelectorAll(".categories button")

btnCategories.forEach(function(btn) {
    btn.addEventListener("click", function() {
        btn.classList.toggle("categorie-active")
    })
})

const coeurs = document.querySelectorAll(".coeur button")

coeurs.forEach(function(coeur) {
    coeur.addEventListener("click", function(e) {
        e.stopPropagation()
        coeur.classList.toggle("actif")
    })
})

let carteEnEdition = null

function ouvrirEdition(carte) {
    carteEnEdition = carte
    const id = carte.dataset.id
    const data = recettesSauvegardees.find(function(r) { return String(r.id) === String(id) })
    if (!data) return

    document.querySelector(".formulaire input[type='text']").value = data.titre

    const tempsInputs = document.querySelectorAll(".temps input")
    if (data.temps) {
        const minutes = parseInt(data.temps)
        tempsInputs[0].value = minutes || ""
    }

    document.querySelectorAll(".categories button").forEach(function(btn) {
        btn.classList.remove("categorie-active")
        if (data.tags && data.tags.includes(btn.textContent)) {
            btn.classList.add("categorie-active")
        }
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

    overlay.style.display = "flex"
}

document.querySelectorAll(".recette").forEach(function(carte) {
    carte.addEventListener("click", function() {
        ouvrirEdition(carte)
    })
})

const btnFavoris = document.querySelector("#btn-favoris")

btnFavoris.addEventListener("click", function() {
    filtres.forEach(function(f) { f.classList.remove("filtre-actif") })
    btnFavoris.classList.add("filtre-actif")

    const recettes = document.querySelectorAll(".recette")
    recettes.forEach(function(recette) {
        const coeur = recette.querySelector(".coeur button")
        if (coeur.classList.contains("actif")) {
            recette.style.display = "block"
        } else {
            recette.style.display = "none"
        }
    })
})

const btnItalien = document.querySelector("#btn-italien")

const filtres = document.querySelectorAll(".boutons button")

btnItalien.addEventListener("click", function() {
    filtres.forEach(function(f) { f.classList.remove("filtre-actif") })
    btnItalien.classList.add("filtre-actif")

    const recettes = document.querySelectorAll(".recette")
    recettes.forEach(function(recette) {
        if (recette.dataset.categorie === "italien") {
            recette.style.display = "block"
        } else {
            recette.style.display = "none"
        }
    })
})

const btnTous = document.querySelector("#btn-Tous")

btnTous.addEventListener("click", function() {
    filtres.forEach(function(f) { f.classList.remove("filtre-actif") })
    btnTous.classList.add("filtre-actif")

    const recettes = document.querySelectorAll(".recette")
    recettes.forEach(function(recette) {
        recette.style.display = "block"
    })
})

const overlay = document.querySelector(".overlay")
const btnAjouter = document.querySelector(".btn-ajouter")

btnAjouter.addEventListener("click", function() {
    overlay.style.display = "flex"
})

const btnSupprimerIngredient = document.querySelector("#btn-supprimer-ingredient")

btnSupprimerIngredient.addEventListener("click", function() {
    document.querySelector("#input-qte").value = ""
    document.querySelector("#input-unite").value = ""
    document.querySelector("#input-ingredient").value = ""
})

const btnAjouterIngredient = document.querySelector(".btn-ajouter-ingredient")

btnAjouterIngredient.addEventListener("click", function() {
    const nouvelleLigne = document.createElement("div")
    nouvelleLigne.classList.add("ligne-ingredient")
    nouvelleLigne.innerHTML = `
        <input type="text" placeholder="Qté">
        <input type="text" placeholder="Unité">
        <input type="text" placeholder="Ingrédient">
        <button class="btn-supprimer-ligne">×</button>
    `
    btnAjouterIngredient.before(nouvelleLigne)

    nouvelleLigne.querySelector(".btn-supprimer-ligne").addEventListener("click", function() {
        nouvelleLigne.remove()
    })
})

const btnAjouterEtape = document.querySelector(".btn-ajouter-etape")

btnAjouterEtape.addEventListener("click", function() {
    const etapes = document.querySelectorAll(".ligne-etape")
    const numero = etapes.length + 1

    const nouvelleEtape = document.createElement("div")
    nouvelleEtape.classList.add("ligne-etape")
    nouvelleEtape.innerHTML = `
        <span class="numero-etape">${numero}</span>
        <textarea placeholder="Décrivez cette étape..."></textarea>
        <button class="btn-supprimer-etape">×</button>
    `
    btnAjouterEtape.before(nouvelleEtape)

    nouvelleEtape.querySelector(".btn-supprimer-etape").addEventListener("click", function() {
        nouvelleEtape.remove()
        document.querySelectorAll(".ligne-etape").forEach(function(etape, index) {
            etape.querySelector(".numero-etape").textContent = index + 1
        })
    })
})

const btnFermer = document.querySelector(".btn-fermer")
btnFermer.addEventListener("click", function() {
    overlay.style.display = "none"
})

const btnAnnuler = document.querySelector(".btn-Annuler")
btnAnnuler.addEventListener("click", function() {
    overlay.style.display = "none"
})

let photoURL = null

const zonePhoto = document.querySelector("#zone-photo")
const inputPhoto = document.querySelector("#input-photo")

zonePhoto.addEventListener("click", function() {
    inputPhoto.click()
})

inputPhoto.addEventListener("change", function() {
    const fichier = inputPhoto.files[0]
    if (fichier) {
        photoURL = URL.createObjectURL(fichier)
        zonePhoto.innerHTML = `<img src="${photoURL}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;">`
    }
})

function resetFormulaire() {
    document.querySelector(".formulaire input[type='text']").value = ""
    document.querySelectorAll(".temps input").forEach(function(i) { i.value = "" })
    document.querySelector(".note textarea").value = ""
    document.querySelectorAll(".categories button").forEach(function(b) { b.classList.remove("categorie-active") })
    document.querySelectorAll(".étoile").forEach(function(e) { e.classList.remove("actif", "demi") })
    const lignes = document.querySelectorAll(".ligne-ingredient")
    lignes.forEach(function(l, i) { if (i > 0) l.remove() })
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

const btnAjouterRecette = document.querySelector(".btn-Ajouter-recette")
btnAjouterRecette.addEventListener("click", function() {
    const titre = document.querySelector(".formulaire input[type='text']").value
    if (!titre) return

    const tempsInputs = document.querySelectorAll(".temps input")
    const prepa = tempsInputs[0].value
    const cuisson = tempsInputs[1].value
    const tempsTotal = prepa && cuisson ? parseInt(prepa) + parseInt(cuisson) + "min" : prepa ? prepa + "min" : cuisson ? cuisson + "min" : ""

    const categoriesActives = document.querySelectorAll(".categories button.categorie-active")
    let tagsHTML = ""
    categoriesActives.forEach(function(btn) {
        tagsHTML += `<span class="tag-italien">${btn.textContent}</span>`
    })

    const etoilesActives = document.querySelectorAll(".étoile.actif").length
    const etoilesDemi = document.querySelectorAll(".étoile.demi").length
    let etoilesHTML = ""
    for (let i = 0; i < 5; i++) {
        if (i < etoilesActives) etoilesHTML += "★"
        else if (i === etoilesActives && etoilesDemi) etoilesHTML += "★"
        else etoilesHTML += "☆"
    }

    const data = {
        titre: titre,
        temps: tempsTotal,
        etoiles: etoilesHTML,
        tags: tagsHTML,
        photo: photoURL,
        favori: false
    }

    if (carteEnEdition) {
        const id = carteEnEdition.dataset.id
        data.id = id
        const index = recettesSauvegardees.findIndex(function(r) { return String(r.id) === String(id) })
        if (index !== -1) recettesSauvegardees[index] = data
        carteEnEdition.querySelector("h2").textContent = titre
        if (tagsHTML) carteEnEdition.querySelector(".tags").innerHTML = tagsHTML
        carteEnEdition.querySelector(".recette-info p").innerHTML = (tempsTotal ? "⏱ " + tempsTotal + " · " : "") + "<span class='etoiles'>" + etoilesHTML + "</span>"
        if (photoURL) {
            const oldPhoto = carteEnEdition.querySelector("img") || carteEnEdition.querySelector(".photo-placeholder")
            if (oldPhoto) oldPhoto.outerHTML = `<img src="${photoURL}" alt="${titre}">`
        }
        carteEnEdition = null
        sauvegarderRecettes()
    } else {
        recettesSauvegardees.push(data)
        sauvegarderRecettes()
        creerCarteRecette(data)
    }

    resetFormulaire()
    overlay.style.display = "none"
})

const btnfacile = document.querySelector("#btn-facile")

btnfacile.addEventListener("click", function() {
    filtres.forEach(function(f) { f.classList.remove("filtre-actif") })
    btnfacile.classList.add("filtre-actif")

    const recettes = document.querySelectorAll(".recette")
    recettes.forEach(function(recette) {
        if (recette.dataset.difficulte === "facile") {
            recette.style.display = "block"
        } else {
            recette.style.display = "none"
        }
    })
})