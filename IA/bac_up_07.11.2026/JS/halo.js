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

        const dpr = window.devicePixelRatio || 1;

        // Adaptation de la résolution du Canvas.
        canvas.width = Math.round(
            (displayWidth + padding * 2) * dpr
        );

        canvas.height = Math.round(
            (displayHeight + padding * 2) * dpr
        );

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        context.clearRect(
            0,
            0,
            displayWidth + padding * 2,
            displayHeight + padding * 2
        );

        /*
        ------------------------------------------------------
        CONFIGURATION DE L'EFFET NÉON
        ------------------------------------------------------
        */

        // Épaisseur du contour lumineux.
        const neonWidth = 2;

        /*
        Trois couches lumineuses :
    
        1. Halo extérieur : diffusion large et discrète.
        2. Halo intermédiaire : rayonnement coloré.
        3. Contour intérieur : lumière plus précise.
        */

        const neonLayers = [
            {
                blur: 24,
                width: 3,
                opacity: 0.35
            },
            {
                blur: 12,
                width: 2.5,
                opacity: 0.65
            },
            {
                blur: 5,
                width: neonWidth,
                opacity: 1
            }
        ];

        /*
        ------------------------------------------------------
        DESSIN DES CONTOURS LUMINEUX
        ------------------------------------------------------
        */

        function drawNeonLine(points) {

            for (const layer of neonLayers) {

                context.save();

                context.lineWidth = layer.width;
                context.lineCap = "round";
                context.lineJoin = "round";

                context.globalAlpha = layer.opacity;

                context.shadowBlur = layer.blur;

                /*
                Chaque segment conserve sa propre couleur.
    
                Le rayonnement utilise donc les couleurs
                réellement présentes sur la bordure.
                */

                for (let i = 0; i < points.length - 1; i++) {

                    const current = points[i];
                    const next = points[i + 1];

                    context.beginPath();

                    context.strokeStyle = current.color;
                    context.shadowColor = current.color;

                    context.moveTo(current.x, current.y);
                    context.lineTo(next.x, next.y);

                    context.stroke();
                }

                context.restore();
            }
        }

        /*
        ------------------------------------------------------
        EXTRACTION DES COULEURS DES QUATRE CÔTÉS
        ------------------------------------------------------
        */

        const horizontalPoints = [];
        const verticalPoints = [];

        // Bordure supérieure.
        for (let x = 0; x <= width; x += SAMPLE_STEP) {

            horizontalPoints.push({
                x: padding + x / width * displayWidth,
                y: padding,
                color: getAverageColor(
                    Math.min(x, width - 1),
                    0,
                    false
                )
            });
        }

        // Bordure inférieure.
        for (let x = 0; x <= width; x += SAMPLE_STEP) {

            horizontalPoints.push({
                x: padding + x / width * displayWidth,
                y: padding + displayHeight,
                color: getAverageColor(
                    Math.min(x, width - 1),
                    height - BORDER_SAMPLE_SIZE,
                    false
                )
            });
        }

        // Bordure gauche.
        for (let y = 0; y <= height; y += SAMPLE_STEP) {

            verticalPoints.push({
                x: padding,
                y: padding + y / height * displayHeight,
                color: getAverageColor(
                    0,
                    Math.min(y, height - 1),
                    true
                )
            });
        }

        // Bordure droite.
        for (let y = 0; y <= height; y += SAMPLE_STEP) {

            verticalPoints.push({
                x: padding + displayWidth,
                y: padding + y / height * displayHeight,
                color: getAverageColor(
                    width - BORDER_SAMPLE_SIZE,
                    Math.min(y, height - 1),
                    true
                )
            });
        }

        /*
        ------------------------------------------------------
        APPLICATION DES EFFETS LUMINEUX
        ------------------------------------------------------
        */

        drawNeonLine(horizontalPoints.slice(0,
            Math.ceil((width + 1) / SAMPLE_STEP)));

        drawNeonLine(horizontalPoints.slice(
            Math.ceil((width + 1) / SAMPLE_STEP)
        ));

        drawNeonLine(verticalPoints);

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

