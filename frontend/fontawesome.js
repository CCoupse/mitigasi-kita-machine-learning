(function () {
  const style = document.createElement('style');
  style.innerHTML = `
    .fas.fa-map-marker-alt::before { content: "\\f3c5"; }
    .fas.fa-search::before { content: "\\f002"; }
    .fas { font-family: "FontAwesome"; }
  `;
  document.head.appendChild(style);
})();