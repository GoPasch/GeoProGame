let timer = 0;
let interval;
let lives = 5;
let penaltyTime = 0;
let remainingCountries = [];
let currentCountry = null;
let selectedContinent = "";

function selectContinent(continent) {
  selectedContinent = continent;
  document.getElementById("highscore-screen").style.display = "none";

  startGame();
}

function startGame() {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "flex";

  document.getElementById("continent-title").textContent =
    capitalize(selectedContinent);

  resetGame();
  startTimer();
  loadData();
}

function resetGame() {
  clearInterval(interval);
  timer = 0;
  lives = 5;
  penaltyTime = 0;
  remainingCountries = [];
  currentCountry = null;

  document.getElementById("timer").textContent = `Zeit: 0.00s`;
  document.getElementById("lives").textContent = `Leben: ${lives}`;
  document.getElementById("map-container").innerHTML = "";
  document.getElementById("flag").src = "";
}

function startTimer() {
  const startTime = performance.now();
  interval = setInterval(() => {
    timer = (performance.now() - startTime) / 1000;
    document.getElementById("timer").textContent = `Zeit: ${timer.toFixed(2)}s`;
  }, 100);
}

function loadData() {
  fetch(`data/${selectedContinent}.json`)
    .then((res) => res.json())
    .then((data) => {
      remainingCountries = data;
      loadMap();
      nextFlag();
    })
    .catch((err) => alert("Fehler beim Laden der Daten: " + err));
}

function loadMap() {
  fetch(`assets/maps/${selectedContinent}.svg`)
    .then((res) => res.text())
    .then((svg) => {
      document.getElementById("map-container").innerHTML = svg;

      const paths = document.querySelectorAll("#map-container svg path");
      paths.forEach((path) => {
        path.style.fill = "#e0e0e0";
        path.style.stroke = "#999";
        path.style.strokeWidth = "1";
        path.style.cursor = "pointer";
        path.classList.remove("correct", "wrong");

        path.addEventListener("click", () => {
          const clickedCode = path.getAttribute("data-code");
          checkAnswer(clickedCode);
        });
      });
    });
}

function nextFlag() {
  if (remainingCountries.length === 0) {
    endGame();
    return;
  }
  const index = Math.floor(Math.random() * remainingCountries.length);
  currentCountry = remainingCountries[index];

  document.getElementById("flag").src = `https://flagcdn.com/w320/${currentCountry.code}.png`;
  document.getElementById("flag").alt = `Flagge von ${currentCountry.name}`;
}

function checkAnswer(clickedCode) {
  const clicked = clickedCode.toLowerCase();
  const correct = currentCountry.code.toLowerCase();
  const allPaths = document.querySelectorAll(`[data-code="${clicked}"]`);

  if (clicked === correct) {
    allPaths.forEach((p) => (p.style.fill = "#4caf50"));
    remainingCountries = remainingCountries.filter(
      (c) => c.code.toLowerCase() !== clicked
    );
    nextFlag();
  } else {
    lives--;
    penaltyTime += 10;
    document.getElementById("lives").textContent = `Leben: ${lives}`;

    allPaths.forEach((p) => (p.style.fill = "#f44336"));

    setTimeout(() => {
      allPaths.forEach((p) => {
        const code = p.getAttribute("data-code").toLowerCase();
        const stillRemaining = remainingCountries.some(
          (c) => c.code.toLowerCase() === code
        );
    
        if (stillRemaining) {
          p.style.fill = "#e0e0e0";
        } else {
          p.style.fill = "#4caf50"; // bleibe grün
        }
      });
    }, 800);
    

    if (lives <= 0) {
      endGame();
    }
  }
}

function endGame() {
  clearInterval(interval);
  const mistakes = 5 - lives;
  const totalTime = (timer + mistakes * 10).toFixed(2);

  if (lives <= 0) {
    alert("Game Over!\nDu hast alle Leben verloren.");
    backToMenu();
    return;
  }

  const name = prompt(`Spiel beendet!\nGib deinen Namen ein:`);
  if (!name) return;

  saveHighscore(name, timer, penaltyTime, selectedContinent);

  alert(`Du hast ${timer.toFixed(2)} Sekunden gebraucht\nund ${mistakes} Fehler gemacht.\n(= ${totalTime} Sekunden)`);

  backToMenu();
}


function saveHighscore(name, time, penalties, continent) {
  const key = `highscores_${continent}`;
  const entry = {
    name,
    time: parseFloat(time.toFixed(2)),
    errors: Math.round(penalties / 10),
  };

  const current = JSON.parse(localStorage.getItem(key)) || [];
  current.push(entry);

  current.sort(
    (a, b) => a.time + a.errors * 10 - (b.time + b.errors * 10)
  );

  const topTen = current.slice(0, 10);
  localStorage.setItem(key, JSON.stringify(topTen));
}

function showHighscore() {
  const container = document.getElementById("highscore-content");
  container.innerHTML = "";

  const continents = ["europa", "afrika", "asien", "nordamerika", "suedamerika"];

  continents.forEach((continent) => {
    const list = JSON.parse(localStorage.getItem(`highscores_${continent}`)) || [];

    if (list.length > 0) {
      const title = document.createElement("h3");
      title.textContent = capitalize(continent);
      container.appendChild(title);

      const table = document.createElement("table");
      list.forEach((entry) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${entry.name}</td><td>${entry.time}s</td><td>${entry.errors} Fehler</td>`;
        table.appendChild(tr);
      });
      container.appendChild(table);
    }
  });

  document.getElementById("highscore-screen").style.display = "block";
}

function backToMenu() {
  clearInterval(interval);
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("start-screen").style.display = "block";
  document.getElementById("highscore-screen").style.display = "none";
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function deleteAllHighscores() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("highscores_")) {
      localStorage.removeItem(key);
    }
  });
  console.log("Alle lokalen Highscores wurden gelöscht.");
}
