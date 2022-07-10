let keybindings = {};

/**
 * Register a keybinding
 * @param {String} keyCombination Possible syntax with modifiers: "meta + alt + shift + control + [key]"
 * @param {Function} callback
 * @returns {Function} Function, that removes the event listener
 */
export default function addKeybinding(keyCombination, callback) {
    if (keybindings[keyCombination] == null) {
        keybindings[keyCombination] = [];
    }

    keybindings[keyCombination].push(callback);

    // Return a function that removes the event listener
    return () => {
        let index = keybindings[keyCombination].indexOf(callback);
        if (index <= -1) return; // Abort if callback no longer exists

        delete keybindings[keyCombination][index];
    };
}

function compileKeyCombination(event) {
    let keyModifier = "";

    // Modifiers
    if (event.metaKey == true) {
        keyModifier += "meta";
    }

    if (event.altKey == true) {
        keyModifier = "alt";
    }

    if (event.shiftKey == true) {
        keyModifier = "shift";
    }

    if (event.ctrlKey == true) {
        keyModifier = "control";
    }

    // Add real key
    let key = event.key.toLowerCase();

    if (key == keyModifier) return keyModifier; // If pressed key is just a modifier key
    if (keyModifier != "") return `${keyModifier} + ${key}`; // Pressed combination consists of key and modifier
    return key; // Just a keypress without a modifier
}

function initializeKeybindings() {
    document.addEventListener("keydown", (event) => {
        let keyCombination = compileKeyCombination(event);

        // Execute all registered listener function
        keybindings[keyCombination]?.forEach((listenerFunction) => listenerFunction());
    });
}

initializeKeybindings();
