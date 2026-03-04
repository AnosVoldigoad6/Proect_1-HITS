 const settingsBtn = document.getElementById("settingsBtn");
 const modal = document.getElementById("settingsModal");
 const closeModal = document.getElementById("closeModal");
 
 settingsBtn.onclick = function () {
   modal.classList.add("active");
 };
 
 closeModal.onclick = function () {
   modal.classList.remove("active");
 };
 
 
  
 
 const themeToggle = document.getElementById("themeToggle");
 const icon = themeToggle.querySelector("i");
 
 if (localStorage.getItem("theme") === "dark") {
   document.body.classList.add("dark");
   icon.classList.remove("fa-moon");
   icon.classList.add("fa-sun");
 }
 
 themeToggle.onclick = function () {
   document.body.classList.toggle("dark");
   const isDark = document.body.classList.contains("dark");
 
   if (isDark) {
     icon.classList.remove("fa-moon");
     icon.classList.add("fa-sun");
   } else {
     icon.classList.remove("fa-sun");
     icon.classList.add("fa-moon");
   }
 
   themeToggle.classList.add("active");
   setTimeout(function () {
     themeToggle.classList.remove("active");
   }, 500);
 
   localStorage.setItem("theme", isDark ? "dark" : "light");
 };
 