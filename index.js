function hexToArray(data) {
    let arr = new Uint8Array(data.length / 2);
    for (let i = 0; i < data.length; i += 2)
        arr[i / 2] = parseInt(data.substr(i, 2), 16);
    return arr;
}

var usedScroll = false;
window.setTimeout(() => {
    if (!usedScroll) {
        window.scrollBy({left: 0, top: 100, behaviour: "smooth"});
        usedScroll = false;
    }
}, 3000);

window.setTimeout(() => {
    if (usedScroll) {
        window.scrollTo(0, 0);
    }
}, 300);

const scrollHint = document.getElementById("scroll-hint");
const restOfPage = document.getElementById("rest-of-page");
const headerBlock = document.getElementById("header-block");
const headerBar = document.getElementById("header-bar");
document.addEventListener("scroll", () => {
    usedScroll = true;
    if (headerBlock.getBoundingClientRect().top <= 20) {
        headerBlock.style.opacity = "0";
        headerBlock.style.pointerEvents = "none";
        headerBar.style.opacity = "1";
        headerBar.style.pointerEvents = "auto";
    }
    else {
        if (headerBlock.getBoundingClientRect().top !== 200 && usedScroll) {
            headerBlock.style.opacity = "1";
            headerBlock.style.pointerEvents = "auto";
            headerBar.style.opacity = "0";
            headerBar.style.pointerEvents = "none";
            scrollHint.style.opacity = "0";
            scrollHint.style.pointerEvents = "none";
            restOfPage.style.opacity = "1";
            restOfPage.style.pointerEvents = "auto";
        }
        else {
            restOfPage.style.opacity = "0";
            restOfPage.style.pointerEvents = "none";
        }
    }   
});
