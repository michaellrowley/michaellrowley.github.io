var scrollMarker = document.getElementById("scroll-marker");
var scrollTab = document.getElementById("scroll-tab");
var htmlElement = document.documentElement;

function updateScrollUI() {
    if (!scrollMarker || !scrollTab) return;

    var scrollRange = Math.max(htmlElement.scrollHeight - window.innerHeight, 1);
    var progress = Math.min(Math.max(window.scrollY / scrollRange, 0.01), 1);
    scrollMarker.style.height = (progress * 100).toString() + "%";
    scrollTab.style.opacity = window.scrollY < 10 ? "0.35" : "1";
}

window.addEventListener("scroll", updateScrollUI, { passive: true });
window.addEventListener("resize", updateScrollUI);
updateScrollUI();
