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

const keybox = document.getElementById("personal-keybox");
const personalOverlay = document.getElementById("personal-overlay");
document.addEventListener("selectionchange", (event) => {
    // https://stackoverflow.com/a/52157976
    const newHighlight = window.getSelection().toString();
    if (newHighlight.length < 3)
        return;
    const emphasisedTags = document.getElementsByTagName("em");
    if (emphasisedTags.length < 3)
        return;
    let emphasisedTagsSum = "";
    for (var i = 0; i < 3; i++)
        emphasisedTagsSum += emphasisedTags[i].innerText;
    if (emphasisedTagsSum === newHighlight) {
        personalOverlay.style.opacity = "1";
        personalOverlay.style.pointerEvents = "auto";
        keybox.style.visibility = "visible";
        keybox.style.pointerEvents = "auto";
        window.getSelection().removeAllRanges();
    }
});

const openButton = document.getElementById("open-button");
const keyInput = document.getElementById("key-input");
const idInput = document.getElementById("id-input");
const contents = document.getElementById("personal-contents");
personalOverlay.onclick = (event) => {
    if (event.target !== personalOverlay)
        return;
    personalOverlay.style.opacity = "0";
    personalOverlay.style.pointerEvents = "none";
    contents.innerHTML = "";
    contents.style.visibility = "hidden";
    contents.style.pointerEvents = "none";
    keybox.style.visibility = "auto";
};
openButton.onclick = (event) => {
    const id = idInput.value;
    const keyData = hexToArray(keyInput.value);
    keyInput.value = "";
    console.log(keyData);
    const ciphertexts = {
        "Public": [
            0x0c, 0x9a, 0x54, 0x8d, 0xa9, 0xbb, 0xc5, 0x91, 0x64, 0x33, 0x2b, 0x4e, 0xcf, 0xf2, 0x4c, 0x86, 0x0a, 0x4f, 0x5c, 0x51, 0x9a, 0x12, 0xc6, 0x11, 0xf3, 0x93, 0xce, 0xde, 0x3a, 0xac, 0x4d, 0xac, 0xf1, 0xcc, 0xd1, 0x8a, 0xc6, 0x0c, 0x96, 0x35, 0xb1, 0xea, 0x32, 0x9d, 0xf2, 0x80, 0xcc, 0x77, 0x5d, 0xfd, 0x58, 0x59, 0x1a, 0x10, 0x45, 0x1c, 0x5d, 0x67, 0xbe, 0x82, 0x86, 0x20, 0xef, 0xb8, 0x66, 0xb9, 0x90, 0x5b, 0x89, 0x14, 0xb4, 0xf8, 0x4d, 0x82, 0xf9, 0x82, 0x0b, 0x91, 0xe8, 0x2c, 0x43, 0x75, 0x9f, 0x62, 0xa7, 0x8e, 0xeb, 0xce, 0xbd, 0xcb, 0xec, 0x72, 0x94, 0x4b, 0xed, 0xb8, 0xa9, 0x1e, 0x0d, 0x51, 0x9a, 0x5c, 0x45, 0xf4, 0xb1, 0x71, 0x53, 0x04, 0xc4, 0x7b, 0x32, 0xeb, 0xcd, 0x27, 0x60, 0x27, 0xc8, 0x02, 0x12, 0xdb, 0x44, 0x56, 0x44, 0xa5, 0x06, 0xa9, 0xbe, 0xa4, 0x23, 0xd7, 0xbb, 0x19, 0xb0, 0x52, 0x63, 0x2b, 0x66, 0x79, 0xdd, 0xc0, 0x3c, 0xc6, 0x6d, 0x45, 0xfa, 0x4f, 0x81, 0x5a, 0x61, 0xef, 0x4f, 0xad, 0x26, 0x72, 0x65, 0xf0, 0xe5, 0xfd, 0x18, 0x88, 0x67, 0x43, 0x77, 0xeb, 0x23, 0x7a, 0xfd, 0xae, 0xeb, 0x27, 0xf7, 0x4d, 0x49, 0xa5, 0xde, 0x44, 0xb5, 0x56, 0x24, 0x38, 0xbf, 0x13, 0xb6, 0xb8, 0xc3, 0xed, 0x58, 0xf3, 0x3c, 0xb1, 0x35, 0x84, 0xc0, 0xbe, 0x16, 0x61, 0x26, 0xaa, 0x31, 0x1a, 0x72, 0xa6, 0xcf, 0x68, 0x1d, 0x0c, 0xa5, 0x7a, 0x3c, 0x21, 0xc2, 0x4c, 0xe1, 0xea, 0x44, 0x50, 0x7d, 0x3b, 0x6b, 0x30, 0x64, 0xea, 0x82, 0xc5, 0xc2, 0x29, 0x5a, 0xf3, 0x9d, 0x7e, 0x08, 0x86, 0x6c, 0x33, 0xe1, 0x22, 0xd7 ]
    };
    const selectedCiphertext = ciphertexts[id];
    if (selectedCiphertext === undefined) {
        alert("Invalid ID.");
        return;
    }
    for (let i = 0; i < selectedCiphertext.length; i++) {
        // Never roll your own cryptography in a serious application,
        // this is just for fun, otherwise I'd look at AES-GCM-256:
        selectedCiphertext[i] ^= keyData[i % keyData.length];
        // ^ (i > 0 ? selectedCiphertext[i - 1] : 0);
    }
    console.log(selectedCiphertext);
    contents.innerHTML = String.fromCharCode.apply(null, selectedCiphertext);
    keybox.style.visibility = "hidden";
    keybox.style.pointerEvents = "none";
    contents.style.visibility = "visible";
    contents.style.pointerEvents = "auto";
};

console.log("Take a look at the HTML source code! (CTRL/CMD + U)");
// Or just read this script, I guess (^)