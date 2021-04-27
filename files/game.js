/* AppName: FindTheNeighbours 
   Author: Christos Katsandris (https://www.linkedin.com/in/christos-katsandris/)
   Location: https://github.com/christoskatsandris/FindTheNeighbours */

// Stopwatch code source: https://stackoverflow.com/questions/20318822/how-to-create-a-stopwatch-using-javascript (with some modifications)

// Variable declarations

const allCountries = new Array();
const allPromises = new Array();
const allCountriesWithNeighbours = new Array();
let storageAccessDenied = false;
let currentGame = null;
let myCountryFlagElement = null;
let myCountryNameElement = null;
let roundNumberElement = null;
let scoreNumberElement = null;
let neighboursPanelElement = null;
let nextRoundButton = null;
let settingsPanelElement = null;
let hintFieldElement = null;
let helpPanelElement = null;
let nextRoundPanelElement = null;
let highScoreTable = null;

// Class declarations

class Country {
    constructor (code, code3, name, number) {
        this.code = code;
        this.code3 = code3;
        this.name = name;
        this.number = number;
        this.loadCountry();
        this.neighbours = new Array();
        this.maxScore = 0;
        this.flag = new Image();
        this.flag.src = `https://restcountries.eu/data/${this.code3.toLowerCase()}.svg`;
    }

    loadCountry () {
        let url = `https://restcountries.eu/rest/v2/alpha/${this.code}`;
        allPromises.push(fetch(url)
        .then((reply) => {
            if (reply.status === 200) return reply.json();
            else throw new Error(reply.status);
        })
        .then((data) => {
            this.data = data;
        }));
    }

    populateNeighbours () {
        return this.data[0].borders;
    }

    static getCountryByCode3 (code3) {
        for (let country of allCountries) {
            if (country.code3 === code3) return country;
        }
    }
}

class Round {
    constructor (country) {
        this.country = country;
        this.foundNeighbours = new Array();
        this.foundWrongNeighbours = new Array();
        this.possibleNeighbours = this.choosePossibleNeighbours();
        this.startRound();
        this.neighboursWithHint = new Array();
    }

    choosePossibleNeighbours() {
        let possibleNeighbours = new Array();
        this.country.neighbours.forEach(neighbour => {
            possibleNeighbours.push(neighbour);
        })
        let extraPossibleNeighbours = 2 * possibleNeighbours.length;
        let counter = 0;
        let shuffledCountries = shuffleArray(allCountries);
        for (let country of shuffledCountries) {
            if (counter === extraPossibleNeighbours) break;
            if (country === this.country) continue;
            if (this.country.neighbours.includes(country)) continue;
            possibleNeighbours.push(country);
            counter++;
        }
        return shuffleArray(possibleNeighbours);
    }

    showPossibleNeighbours() {
        this.removePreviousPossibleNeighbours();
        this.addPossibleNeighbours();
    }

    addPossibleNeighbours() {
        this.possibleNeighbours.forEach(possibleNeighbour => {
            let tileElement = document.createElement("div");
            tileElement.classList.add("neighbour");
            
            let tileFlagElement = document.createElement("img");
            tileFlagElement.classList.add("neighbour-flag");
            tileFlagElement.setAttribute("src", `${possibleNeighbour.flag.src}`);
            tileElement.appendChild(tileFlagElement);

            let tileNameElement = document.createElement("p");
            tileNameElement.classList.add("neighbour-name");
            tileNameElement.innerHTML = `${possibleNeighbour.name}`;
            tileElement.appendChild(tileNameElement);

            tileElement.addEventListener("click", () => {
                tileElement.classList.add("was-clicked");
                if (this.country.neighbours.includes(possibleNeighbour)) { // Correct selection
                    if (!this.foundNeighbours.includes(possibleNeighbour)) {
                        tileElement.classList.add("neighbour-is-valid");
                        currentGame.score += 10;
                        scoreNumberElement.innerHTML = currentGame.score;
                        let currentPercentage = this.foundNeighbours.length / this.country.neighbours.length * 100;
                        this.foundNeighbours.push(possibleNeighbour);
                        let nextPercentage = this.foundNeighbours.length / this.country.neighbours.length * 100;
                        updateProgressbar(currentPercentage, nextPercentage);
                        if (currentGame.score >= 10) {
                            document.querySelector("#hint").src = "files/Assets/idea-on.png";
                        }
                        if (this.neighboursWithHint[this.neighboursWithHint.length - 1] === possibleNeighbour) {
                            hintFieldElement.innerHTML = "";
                        }

                        if (this.foundNeighbours.length === this.country.neighbours.length) {
                            nextRoundPanelElement.innerHTML = "Συγχαρητήρια! Βρήκες όλους τους γείτονες!";
                            if ((currentGame.roundNumber == currentGame.howManyRounds) || (currentGame.playedCountries.length == allCountriesWithNeighbours.length)) {
                                this.endRound(true); // end game
                            }
                            else this.endRound(false);
                        }
                    }
                }
                else { // Incorrect selection
                    if (!this.foundWrongNeighbours.includes(possibleNeighbour)) {
                        tileElement.classList.add("neighbour-is-invalid");
                        currentGame.score -= 5;
                        scoreNumberElement.innerHTML = currentGame.score;
                        this.foundWrongNeighbours.push(possibleNeighbour);
                        if (currentGame.score < 10) {
                            document.querySelector("#hint").src = "files/Assets/idea-off.png";
                        }
                        if (this.foundWrongNeighbours.length === this.country.neighbours.length) {
                            nextRoundPanelElement.innerHTML = "Κρίμα, σε αυτόν τον γύρο έχασες.";
                            if (currentGame.roundNumber == currentGame.howManyRounds || (currentGame.playedCountries.length == allCountriesWithNeighbours.length)) {
                                this.endRound(true); // end game
                            }
                            else this.endRound(false);
                        }
                    }
                }
            });

            neighboursPanelElement.appendChild(tileElement);
        });
    }

    removePreviousPossibleNeighbours() {
        while (neighboursPanelElement.children.length > 0) {
            neighboursPanelElement.removeChild(neighboursPanelElement.children[0]);
        }
    }

    startRound() {
        nextRoundPanelElement.style.display = "none";
        nextRoundButton.disabled = true;
        document.querySelector("#progress-bar").style.width = 0;
    }

    endRound(endGame) {
        if (endGame) {
            currentGame.ended = true;
            nextRoundPanelElement.innerHTML += `<br>Το παιχνίδι ολοκληρώθηκε.<br>Το τελικό σκορ είναι ${currentGame.score} πόντοι (με μέγιστο ${currentGame.maxScore} πόντους).`;
            currentGame.end();
        }
        else {
            nextRoundButton.disabled = false;
        }
        hintFieldElement.innerHTML = "";
        nextRoundPanelElement.style.display = "flex";
    }

    getHint() {
        if ((hintFieldElement.innerHTML == "") && (currentGame.score >= 10)) { // If there isn't active hint and minimum score is achieved
            for (let neighbour of this.country.neighbours) { // then find the first neighbour
                if (!this.foundNeighbours.includes(neighbour)) { // that is not yet found
                    // and show the first letter of its name
                    currentGame.score -= 10;
                    if (currentGame.score < 10) {
                        document.querySelector("#hint").src = "files/Assets/idea-off.png";
                    }
                    scoreNumberElement.innerHTML = currentGame.score;
                    this.neighboursWithHint.push(neighbour);
                    hintFieldElement.innerHTML = `Πρώτο γράμμα: ${neighbour.name.charAt(0)}`;
                    return; // and stop searching
                }
            }
        }
    }
}

class Game {
    constructor (howManyRounds) {
        this.ended = false;
        this.roundNumber = 0;
        this.howManyRounds = howManyRounds;
        this.score = 0;
        this.maxScore = 0;
        this.round = null;
        this.playedCountries = new Array();
        this.stopwatch = new Stopwatch(document.querySelector("#time-elapsed-number"), {delay: 1000});
    }

    startNewRound () {
        this.roundNumber++;
        let shuffledCountries = shuffleArray(allCountriesWithNeighbours);
        for (let country of shuffledCountries) {
            if (this.playedCountries.includes(country)) continue;
            this.round = new Round(country);
            this.playedCountries.push(country);
            this.maxScore += country.maxScore;
            break;
        }
        this.updateMyCountryElement();
        this.round.showPossibleNeighbours();
    }

    updateMyCountryElement () {
        myCountryFlagElement.setAttribute("src", `${this.round.country.flag.src}`);
        myCountryNameElement.innerHTML = this.round.country.name;
        roundNumberElement.innerHTML = this.roundNumber;
        scoreNumberElement.innerHTML = this.score;
    }

    showSettings () {
        settingsPanelElement.style.display = "grid";
    }

    end() {
        this.stopwatch.stop();
        try {
            if (this.howManyRounds == 5) {
                if (this.score > highScoreTable[0] || (this.score == highScoreTable[0] && this.stopwatch.time < highScoreTable[1])) this.setNewHighScore(0);
            }
            else if (this.howManyRounds == 10) {
                if (this.score > highScoreTable[2] || (this.score == highScoreTable[2] && this.stopwatch.time < highScoreTable[3])) this.setNewHighScore(2);
            }
            else if (this.howManyRounds == 20) {
                if (this.score > highScoreTable[4] || (this.score == highScoreTable[4] && this.stopwatch.time < highScoreTable[5])) this.setNewHighScore(4);
            }
            else {
                if (this.score > highScoreTable[6] || (this.score == highScoreTable[6] && this.stopwatch.time < highScoreTable[7])) this.setNewHighScore(6);
            }
        } catch (e) {
            console.log("Storage access is denied. High scores are not logged.");
            storageAccessDenied = true;
        }
    }

    setNewHighScore(category) {
        nextRoundPanelElement.innerHTML += "<br>Νέο high score για την κατηγορία ";
        highScoreTable[category] = this.score;
        highScoreTable[category+1] = this.stopwatch.time() / 1000;
        if (category == 0) {
            nextRoundPanelElement.innerHTML += `"5 γύροι"!`;
            localStorage.setItem("fiveRoundsHighScore", String(this.score));
            localStorage.setItem("fiveRoundsBestTime", String(this.stopwatch.time() / 1000));
        }
        else if (category == 1) {
            nextRoundPanelElement.innerHTML += `"10 γύροι"!`;
            localStorage.setItem("tenRoundsHighScore", String(this.score));
            localStorage.setItem("tenRoundsBestTime", String(this.stopwatch.time() / 1000));
        }
        else if (category == 2) {
            nextRoundPanelElement.innerHTML += `"20 γύροι"!`;
            localStorage.setItem("twentyRoundsHighScore", String(this.score));
            localStorage.setItem("twentyRoundsBestTime", String(this.stopwatch.time() / 1000));
        }
        else {
            nextRoundPanelElement.innerHTML += `"Όλες οι χώρες"!`;
            localStorage.setItem("maxRoundsHighScore", String(this.score));
            localStorage.setItem("maxRoundsBestTime", String(this.stopwatch.time()));
        }
        updateHighScoresPanel();
    }
}

// Function declarations

function findNeighbours() {
    allCountries.forEach(country => {
        let neighbours = country.data.borders;
        neighbours.forEach(neighbour => {
            country.neighbours.push(Country.getCountryByCode3(neighbour));
        });
        if (neighbours.length != 0) allCountriesWithNeighbours.push(country);
        country.maxScore = country.neighbours.length * 10;
    });
}

let i = 0;
function updateProgressbar(currentPercentage, nextPercentage) {
    if (i == 0) {
        i = 1;
        var progressBarElement = document.querySelector("#progress-bar");
        var width = currentPercentage;
        var id = setInterval(frame, 10);
        function frame() {
            if (width >= nextPercentage) {
                clearInterval(id);
                i = 0;
            }
            else {
                width++;
                progressBarElement.style.width = width + "%";
            }
        }
    }
}

function initiateSettings() {
    if (currentGame) { // Overcome null at start
        document.querySelector("#time-elapsed-number").innerHTML = "";
        currentGame.stopwatch.reset();
    }
    document.querySelector("#settings").reset();
    nextRoundPanelElement.style.display = "none";
    nextRoundButton.disabled = true;
    document.querySelector("#progress-bar").style.width = 0;
    neighboursPanelElement.style.display = "none";
    settingsPanelElement.style.display = "grid";
    roundNumberElement.innerHTML = "";
    scoreNumberElement.innerHTML = "";
    myCountryFlagElement.setAttribute("src", "");
    myCountryNameElement.innerHTML = "";
    document.querySelector("#hint").style.display = "none";
    document.querySelector("#help-container").style.marginLeft = "auto";
}

function startGame() {
    if (document.querySelector("#fiveRounds").checked || document.querySelector("#tenRounds").checked || document.querySelector("#twentyRounds").checked || document.querySelector("#maxRounds").checked) {
        if (document.querySelector("#fiveRounds").checked) currentGame = new Game(5);
        else if (document.querySelector("#tenRounds").checked) currentGame = new Game(10);
        else if (document.querySelector("#twentyRounds").checked) currentGame = new Game(20);
        else currentGame = new Game(Infinity);

        currentGame.startNewRound();
        neighboursPanelElement.style.display = "flex";
        settingsPanelElement.style.display = "none";
        document.querySelector("#hint").style.display = "block";
        document.querySelector("#hint").src = "files/Assets/idea-off.png";
        document.querySelector("#help-container").style.marginLeft = "10px"
        hintFieldElement.innerHTML = "";
        currentGame.stopwatch.start();
    }
}

function getExistingHighScores() {
    let buffer = ["fiveRoundsHighScore", "fiveRoundsBestTime",
                    "tenRoundsHighScore", "tenRoundsBestTime",
                    "twentyRoundsHighScore", "twentyRoundsBestTime",
                    "maxRoundsHighScore", "maxRoundsBestTime"];
    for (category of buffer) {
        let currentEntry = localStorage.getItem(category);
        if (!currentEntry) {
            localStorage.setItem(category, "0");
            currentEntry = localStorage.getItem(category);
        }
        highScoreTable.push(parseInt(currentEntry));
    }
}

function updateHighScoresPanel() {
    document.querySelector("#fiveRoundsHighScoreNumber").innerHTML = `${highScoreTable[0]} (${parse(highScoreTable[1])})`;
    document.querySelector("#tenRoundsHighScoreNumber").innerHTML = `${highScoreTable[2]} (${parse(highScoreTable[3])})`;
    document.querySelector("#twentyRoundsHighScoreNumber").innerHTML = `${highScoreTable[4]} (${parse(highScoreTable[5])})`;
    document.querySelector("#maxRoundsHighScoreNumber").innerHTML = `${highScoreTable[6]} (${parse(highScoreTable[7])})`;
}

function clearHighScores() {
    if (confirm("Προσοχή! Τα αποθηκευμένα high scores θα χαθούν. Θέλεις σίγουρα να συνεχίσεις;")) {
        for (let i=0; i<8; i++) {
            highScoreTable[i] = 0;
        }
        localStorage.setItem("fiveRoundsHighScore", "0");
        localStorage.setItem("fiveRoundsBestTime", "0");
        localStorage.setItem("tenRoundsHighScore", "0");
        localStorage.setItem("tenRoundsBestTime", "0");
        localStorage.setItem("twentyRoundsHighScore", "0");
        localStorage.setItem("twentyRoundsBestTime", "0");
        localStorage.setItem("maxRoundsHighScore", "0");
        localStorage.setItem("maxRoundsBestTime", "0");
        updateHighScoresPanel();
    }
}

let Stopwatch = function(elem, options) {
    var timer = createTimer(), offset, clock, interval;
    
    // default options
    options = options || {};
    options.delay = options.delay || 1;

    // append elements
    elem.appendChild(timer);

    // initialize
    reset();

    // private functions
    function createTimer() {
        return document.createElement("span");
    }

    function start() {
        if (!interval) {
            offset = Date.now();
            interval = setInterval(update, options.delay);
        }
    }

    function stop() {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    }

    function reset() {
        clock = 0;
        render();
    }

    function update() {
        clock += delta();
        render();
    }

    function render() {
        let secs = clock / 1000;
        timer.innerHTML = parse(secs);
    }

    function delta() {
        var now = Date.now();
        var d = now - offset;
        offset = now;
        return d;
    }

    function time() {
        return clock;
    }

    // public API
    this.start = start;
    this.stop = stop;
    this.reset = reset;
    this.time = time;
}

function parse(secs) {
    let renderedMinutes = Math.floor(secs / 60).toString();
    let seconds = Math.floor(secs % 60).toString();
    let renderedSeconds = "";
    if (seconds.length == 1) renderedSeconds = "0" + seconds;
    else renderedSeconds = seconds;
    return `${renderedMinutes}:${renderedSeconds}`;
}

function hideHighScorePanel() {
    document.querySelector("#high-scores").style.display = "none";
}

// Script entry point

countryObjects.forEach(country => {
    allCountries.push(new Country(country.code, country.code3, country.name, country.number));
});

document.addEventListener("DOMContentLoaded", () => {
    myCountryFlagElement = document.querySelector("#my-country-flag");
    myCountryNameElement = document.querySelector("#my-country-name");
    roundNumberElement = document.querySelector("#round-number");
    scoreNumberElement = document.querySelector("#score-number");
    neighboursPanelElement = document.querySelector("#neighbours-panel");
    nextRoundButton = document.querySelector("#btn-next-round");
    settingsPanelElement = document.querySelector("#settings-panel-container");
    hintFieldElement = document.querySelector("#hint-field");
    helpPanelElement = document.querySelector("#help-panel");
    nextRoundPanelElement = document.querySelector("#next-round-panel");
    highScoreTable = new Array();

    Promise.all(allPromises).then((reply) => {
        try {
            getExistingHighScores();
            updateHighScoresPanel();
        } catch (e) {
            console.log("Storage access is denied. High scores are not logged.");
            storageAccessDenied = true;
            hideHighScorePanel();
        }
        findNeighbours();
        // All set
        // Start a new game

        initiateSettings();
    });

    //event listener to new game button
    document.querySelector("#btn-new-game").addEventListener("click", () => {
        if (currentGame) { // Overcome null at start
        currentGame.stopwatch.stop();
            if (!currentGame.ended) {  
                if (confirm("Θέλεις να ξεκινήσεις νέο παιχνίδι; Το τρέχον σκορ θα χαθεί.")) {
                    initiateSettings();
                }
            }
            else {
                initiateSettings();
            }
        }
    });

    //event listener to next round button
    document.querySelector("#btn-next-round").addEventListener("click", () => {
        currentGame.startNewRound();
    });

    document.querySelector("#startButton").addEventListener("click", () => {
        startGame();
    });

    document.querySelector("#clearHighScores").addEventListener("click", () => {
        clearHighScores();
    });

    document.querySelector("#help").addEventListener("mouseover", () => {
        if (helpPanelElement.classList.contains("hidden")) {
            helpPanelElement.classList.remove("hidden");
        }
        helpPanelElement.classList.add("visible");
    });

    document.querySelector("#help").addEventListener("mouseout", () => {
        helpPanelElement.classList.remove("visible");
        helpPanelElement.classList.add("hidden");
    });

    document.querySelector("#hint").addEventListener("click", () => {
        currentGame.round.getHint();
    });
});