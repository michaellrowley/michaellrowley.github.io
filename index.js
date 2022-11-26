var usedScroll = false;
window.setTimeout(() => {
    if (!usedScroll) {
        window.scrollBy({left: 0, top: 100, behaviour: "smooth"});
    }
}, 3000);

window.setTimeout(() => {
    window.scrollTo(0, 0);
}, 300);

const scrollHint = document.getElementById("scroll-hint");
const restOfPage = document.getElementById("rest-of-page");
const headerBlock = document.getElementById("header-block");
const headerBar = document.getElementById("header-bar");
document.addEventListener("scroll", () => {
    usedScroll = true;
    if (headerBlock.getBoundingClientRect().top <= 20) {
        headerBlock.style.opacity = "0";
        headerBar.style.opacity = "1";
    }
    else {
        if (headerBlock.getBoundingClientRect().top !== 200) {
            headerBlock.style.opacity = "1";
            headerBar.style.opacity = "0";
            scrollHint.style.opacity = "0";
            restOfPage.style.opacity = "1";
        }
        else {
            restOfPage.style.opacity = "0";
        }
    }   
});