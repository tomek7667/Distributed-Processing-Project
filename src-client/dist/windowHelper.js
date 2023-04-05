var addListeners = function () {
    var submitHashButton = document.getElementById("submit-hash");
    submitHashButton.addEventListener("click", function () {
        console.log("Clicked!");
        var hash = document.getElementById("hash-field").value;
        var algorithm = document.getElementById("algorithm-select").value;
        window.api.submitHash({
            hash: hash,
            algorithm: algorithm,
        });
    });
};
window.addEventListener("DOMContentLoaded", function () {
    console.log("DOM loaded");
    addListeners();
});
//# sourceMappingURL=windowHelper.js.map