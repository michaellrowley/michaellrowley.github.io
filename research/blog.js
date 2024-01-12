var scrollY = 0; /* (px) */
var scrollMarker = document.getElementById("scroll-marker");
var scrollTab = document.getElementById("scroll-tab");
var htmlElement = document.getElementsByTagName("html")[0];

function updateScrollUI() {
    scrollTab.opacity = window.scrollY < 10 ? "0.0" : "1.0";
    scrollMarker.style.height = (Math.max(window.pageYOffset / (htmlElement.scrollHeight - window.innerHeight - 5), 0.01) * 100.0).toString() + "%";
}

document.addEventListener("wheel", updateScrollUI);

updateScrollUI();
