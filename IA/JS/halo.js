"use strict";

/*
=========================================================
 GÉNÉRATEUR DE HALO LUMINEUX MULTICOLORE
=========================================================

 Fonctionnement :

 1. Récupération des images concernées.
 2. Analyse des pixels situés sur leurs bordures.
 3. Extraction des couleurs périphériques.
 4. Création d'un Canvas indépendant.
 5. Reproduction des couleurs autour de l'image.
 6. Application d'un flou lumineux.
 7. Activation du halo uniquement au survol.

 Technologies :
 - JavaScript natif
 - Canvas API 2D
 - HTML5
 - CSS3

 Aucune bibliothèque externe nécessaire.
=========================================================
*/


/* ======================================================
   PARAMÈTRES GÉNÉRAUX
====================================================== */

// Épaisseur de la zone analysée sur les bordures.
const BORDER_SAMPLE_SIZE = 8;

// Intensité du flou lumineux.
const GLOW_BLUR = 18;

// Épaisseur des traits lumineux générés.
const GLOW_WIDTH = 12;

// Intensité générale du halo.
const GLOW_OPACITY = 0.95;

// Nombre de pixels regroupés pour chaque échantillon.
const SAMPLE_STEP = 3;


/* ======================================================
   INITIALISATION DU SYSTÈME
====================================================== */

document.addEventListener("DOMContentLoaded", () => {

    // Recherche de toutes les images compatibles.
    const images = document.querySelectorAll(
        ".image-glow .glow-target"
    );

    // Initialisation individuelle de chaque image.
    images.forEach(image => {

        // Attendre le chargement complet de l'image.
        if (image.complete && image.naturalWidth > 0) {

            initializeGlow(image);

        } else {

            image.addEventListener(
                "load",
                () => initializeGlow(image),
                { once: true }
            );

        }

    });

});


/* ======================================================
   INITIALISATION DU HALO POUR UNE IMAGE
====================================================== */

function initializeGlow(image) {

    const container = image.closest(".image-glow");

    // Vérification de l'existence du conteneur.
    if (!container) return;

    // Éviter de créer plusieurs Canvas sur une même image.
    if (container.querySelector(".glow-canvas")) return;

    // Création du Canvas indépendant.
    const canvas = document.createElement("canvas");

    canvas.className = "glow-canvas";

    container.insertBefore(canvas, image);

    const context = canvas.getContext("2d");

    if (!context) return;

    /*
    Création d'un Canvas temporaire.

    Celui-ci sert uniquement à récupérer les pixels
    de l'image originale.
    */

    const sourceCanvas = document.createElement("canvas");

    const sourceContext = sourceCanvas.getContext("2d", {
        willReadFrequently: true
    });

    sourceCanvas.width = image.naturalWidth;
    sourceCanvas.height = image.naturalHeight;

    // Dessin de l'image originale dans le Canvas temporaire.
    sourceContext.drawImage(
        image,
        0,
        0,
        sourceCanvas.width,
        sourceCanvas.height
    );

    /*
    Récupération des données RGBA de chaque pixel.

    Chaque pixel possède quatre composantes :
    R = Rouge
    G = Vert
    B = Bleu
    A = Transparence
    */

    let pixels;

    try {

        pixels = sourceContext.getImageData(
            0,
            0,
            sourceCanvas.width,
            sourceCanvas.height
        ).data;

    } catch (error) {

        console.error(
            "Impossible d'analyser les pixels de l'image :",
            error
        );

        canvas.remove();

        return;
    }


    /* ==================================================
       EXTRACTION DES COULEURS
    ================================================== */

    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    /*
    Fonction permettant de récupérer la couleur moyenne
    d'une petite zone de pixels.

    Cela évite de dépendre d'un seul pixel qui pourrait
    être particulièrement clair ou sombre.
    */

    function getAverageColor(x, y, horizontal) {

        let red = 0;
        let green = 0;
        let blue = 0;
        let alpha = 0;

        let count = 0;

        for (
            let i = 0;
            i < BORDER_SAMPLE_SIZE;
            i++
        ) {

            const px = horizontal ? x : x + i;
            const py = horizontal ? y + i : y;

            if (px < 0 || py < 0 ||
                px >= width || py >= height) {
                continue;
            }

            const index = (py * width + px) * 4;

            red += pixels[index];
            green += pixels[index + 1];
            blue += pixels[index + 2];
            alpha += pixels[index + 3];

            count++;

        }

        if (count === 0) {

            return "rgba(0, 0, 0, 0)";

        }

        return `rgba(
            ${Math.round(red / count)},
            ${Math.round(green / count)},
            ${Math.round(blue / count)},
            ${alpha / (count * 255)}
        )`;

    }


    /* ==================================================
       GÉNÉRATION DU HALO
    ================================================== */

    function generateGlow() {

        const padding = 35;

        const displayWidth = image.clientWidth;
        const displayHeight = image.clientHeight;

        if (!displayWidth || !displayHeight) return;

        /*
        Adaptation de la résolution du Canvas à l'écran.

        Le facteur DPR améliore la netteté du rendu
        sur les écrans haute densité.
        */

        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.round(
            (displayWidth + padding * 2) * dpr
        );

        canvas.height = Math.round(
            (displayHeight + padding * 2) * dpr
        );

        context.setTransform(
            dpr, 0, 0, dpr, 0, 0
        );

        context.clearRect(
            0,
            0,
            displayWidth + padding * 2,
            displayHeight + padding * 2
        );

        /*
        Le flou est appliqué directement pendant le dessin.

        Les couleurs des bordures sont donc diffusées
        naturellement autour de l'image.
        */

        context.filter = `blur(${GLOW_BLUR}px)`;

        context.globalAlpha = GLOW_OPACITY;

        context.lineWidth = GLOW_WIDTH;

        context.lineCap = "round";


        /* ----------------------------------------------
           BORDURE SUPÉRIEURE
        ---------------------------------------------- */

        for (let x = 0; x < width; x += SAMPLE_STEP) {

            const color = getAverageColor(x, 0, false);

            const nextX = Math.min(
                x + SAMPLE_STEP,
                width
            );

            context.beginPath();

            context.strokeStyle = color;

            context.moveTo(
                padding + x / width * displayWidth,
                padding
            );

            context.lineTo(
                padding + nextX / width * displayWidth,
                padding
            );

            context.stroke();

        }


        /* ----------------------------------------------
           BORDURE INFÉRIEURE
        ---------------------------------------------- */

        for (let x = 0; x < width; x += SAMPLE_STEP) {

            const color = getAverageColor(
                x,
                height - BORDER_SAMPLE_SIZE,
                false
            );

            const nextX = Math.min(
                x + SAMPLE_STEP,
                width
            );

            context.beginPath();

            context.strokeStyle = color;

            context.moveTo(
                padding + x / width * displayWidth,
                padding + displayHeight
            );

            context.lineTo(
                padding + nextX / width * displayWidth,
                padding + displayHeight
            );

            context.stroke();

        }


        /* ----------------------------------------------
           BORDURE GAUCHE
        ---------------------------------------------- */

        for (let y = 0; y < height; y += SAMPLE_STEP) {

            const color = getAverageColor(0, y, true);

            const nextY = Math.min(
                y + SAMPLE_STEP,
                height
            );

            context.beginPath();

            context.strokeStyle = color;

            context.moveTo(
                padding,
                padding + y / height * displayHeight
            );

            context.lineTo(
                padding,
                padding + nextY / height * displayHeight
            );

            context.stroke();

        }


        /* ----------------------------------------------
           BORDURE DROITE
        ---------------------------------------------- */

        for (let y = 0; y < height; y += SAMPLE_STEP) {

            const color = getAverageColor(
                width - BORDER_SAMPLE_SIZE,
                y,
                true
            );

            const nextY = Math.min(
                y + SAMPLE_STEP,
                height
            );

            context.beginPath();

            context.strokeStyle = color;

            context.moveTo(
                padding + displayWidth,
                padding + y / height * displayHeight
            );

            context.lineTo(
                padding + displayWidth,
                padding + nextY / height * displayHeight
            );

            context.stroke();

        }


        /*
        Réinitialisation des paramètres du contexte.
        */

        context.filter = "none";

        context.globalAlpha = 1;

    }


    /* ==================================================
       MISE À JOUR AUTOMATIQUE
    ================================================== */

    /*
    Si l'image change de dimensions, on régénère le halo.

    Cela permet de conserver les proportions lorsque
    l'image est redimensionnée par le CSS.
    */

    const resizeObserver = new ResizeObserver(() => {

        generateGlow();

    });

    resizeObserver.observe(image);


    /* ==================================================
       PREMIÈRE GÉNÉRATION
    ================================================== */

    generateGlow();

    console.log(
        "Halo lumineux initialisé :",
        image.src
    );

}