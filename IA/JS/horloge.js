/*
==========================================
HORLOGE EN TEMPS RÉEL
OPÉRATION BLACKOUT
==========================================
*/

// Récupération de l'élément HTML.
const horloge = document.getElementById(
    'blackout-horloge'
);

// Actualisation de l'heure.
function actualiserHorlogeBlackout() {

    // Vérification de l'existence de l'élément.
    if (!horloge) {
        return;
    }

    // Récupération de l'heure locale.
    const maintenant = new Date();

    // Formatage de l'heure : HH:MM:SS.
    horloge.textContent =
        maintenant.toLocaleTimeString(
            'fr-FR',
            {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }
        );
}

// Affichage immédiat de l'heure.
actualiserHorlogeBlackout();

// Actualisation automatique toutes les secondes.
setInterval(
    actualiserHorlogeBlackout,
    1000
);

