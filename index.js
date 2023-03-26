var usedScroll = false;
window.setTimeout(() => {
    if (!usedScroll) {
        showMainContents();
    }
}, 3000);

function showMainContents() {
    headerBlock.style.opacity = "1";
    headerBlock.style.pointerEvents = "auto";
    headerBar.style.opacity = "0";
    headerBar.style.pointerEvents = "none";
    scrollHint.style.opacity = "0";
    scrollHint.style.pointerEvents = "none";
    restOfPage.style.opacity = "1";
    restOfPage.style.pointerEvents = "auto";
    if (typeTick.intervalID === undefined) {
        typeTick.intervalID = 0;
        setTimeout(() => {
            typeTick.intervalID = setInterval(typeTick, 150);
        }, 500);
    }
}

const scrollHint = document.getElementById("scroll-hint");
const restOfPage = document.getElementById("rest-of-page");
const headerBlock = document.getElementById("header-block");
const headerBar = document.getElementById("header-bar");
if (headerBlock.getBoundingClientRect().top < headerBar.getBoundingClientRect().bottom) {
    showMainContents();
}
document.addEventListener("scroll", () => {
    usedScroll = true;
    if (headerBlock.getBoundingClientRect().top <= 20) {
        headerBlock.style.opacity = "0";
        headerBlock.style.pointerEvents = "none";
        headerBar.style.opacity = "1";
        headerBar.style.pointerEvents = "auto";
    }
    else {
        if (headerBlock.getBoundingClientRect().top !== 200) {
            showMainContents();
        }
        else {
            restOfPage.style.opacity = "0";
            restOfPage.style.pointerEvents = "none";
            const intervalID = typeTick.intervalID;
            if (intervalID !== 0 && typeTick.intervalID !== undefined) {
                typeTick.intervalID = undefined;
                clearInterval(intervalID);
            }
        }
    }
});

document.addEventListener("wheel", (event) => {
    const reachedBottom = document.getElementById("rest-of-page").getBoundingClientRect().bottom < screen.height / 2;
    if (reachedBottom && event.deltaY > 0) {
        event.preventDefault();
    }
}, {passive: false});
document.addEventListener("keydown", (event) => {
    const reachedBottom = document.getElementById("rest-of-page").getBoundingClientRect().bottom < screen.height / 2;
    if ((event.key === "ArrowDown" && reachedBottom) || event.key === " ") {
        event.preventDefault();
    }
}, {passive: false});

let helloElement = document.getElementById("hello-element");
function typeTick() {
    const languageDefs = [
        "Hello!",
        // "こんにちは!",
        "Bonjour!",
        // "你好!",
        "Hoi!",
        // "नमस्ते!",
        "Halo!",
        "Avuxeni!",
        "Saluton!",
        "Salve!"
        // "Halló!"
    ];
    if (typeTick.mode == undefined) {
        typeTick.mode = {
            method: "bsp",
            language: 0,
            tick: 0
        };
    }

    if (typeTick.mode.method === "bsp") {
        const finalLength = languageDefs[typeTick.mode.language].length - typeTick.mode.tick++;
        helloElement.innerHTML = finalLength == 0 ? " " : helloElement.innerHTML.substring(0, finalLength);
        if (finalLength === 0) {
            typeTick.mode.method = "typ";
            typeTick.mode.language = (typeTick.mode.language + 1) % languageDefs.length;
            typeTick.mode.tick = 0;
        }
    }
    else {
        const nextChar = languageDefs[typeTick.mode.language][typeTick.mode.tick++];
        helloElement.innerHTML += nextChar;
        if (typeTick.mode.tick == languageDefs[typeTick.mode.language].length) {
            typeTick.mode.method = "bsp";
            typeTick.mode.language = (typeTick.mode.language + 1) % languageDefs.length;
            typeTick.mode.tick = 0;
            clearInterval(typeTick.intervalID);
            setTimeout(() => {
                typeTick.intervalID = setInterval(typeTick, 150);
            }, 2000);
        }
    }
}