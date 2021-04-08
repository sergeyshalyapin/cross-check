const SCORE = document.getElementById("score");

let questions = [];
let questionCounter = 0;
let currentPage = "";
let currentQuestion = 0;
let optionCounter = 0;


// STAGE 1
const START = document.getElementById("start");

// Load selected variant.
START.addEventListener("click", () => {
  fetch(`./var${document.getElementById("variant").value}.json`)
  .then(res => res.json())
  .then(
    (data) => {
      document.getElementById("stage-1").classList.add("hidden");
      document.getElementById("stage-2").classList.remove("hidden");
      questions = [...data];
      questions.forEach(q => createQuestion(q));
    }
  )
});

// Calculate height of the question block to support necessary scroll, if height is big enough.
const recalculateMainHeight = (element) => {
  const headerHeight = Math.round(window.getComputedStyle(document.getElementById("header")).height.split("px")[0]);
  const footerHeight = Math.round(window.getComputedStyle(document.getElementById("footer")).height.split("px")[0]);
  const elementHeight = Math.round(window.getComputedStyle(element).height.split("px")[0]);
  const main = document.getElementById("main");

  let newHeight = 0;
  if (window.innerHeight - headerHeight - footerHeight > elementHeight) {
    newHeight = window.innerHeight - headerHeight - footerHeight;
  } else {
    newHeight = elementHeight + footerHeight;
  }

  main.style.minHeight = newHeight + 10 + "px"
}

// Create questoin blocks with question description and type-based answer options.
const createQuestion = (question) => {
  const questionId = `q${questionCounter}`;
  const progressId = `p${questionCounter}`;
  const mainElement = document.getElementById("main");
  const wrapper = document.createElement("div");
  const progressItem = document.createElement("div");

  wrapper.classList.add("question");
  wrapper.id = questionId;
  wrapper.innerHTML = wrapper.innerHTML + (`<div class="current-page"><p>Страница: </p><p class="current-page-value">${question.page}</p></div>`);
  wrapper.innerHTML = wrapper.innerHTML + (`<div class="current-block"><p>Блок: </p><p>${question.block}</p></div>`);
  wrapper.innerHTML = wrapper.innerHTML + (`<div class="current-comment"><p>${question.comment}</p></div>`);

  question.options.forEach((opt, i) => {
    const optionId = `o${optionCounter}`;
    const qustionBlock = document.createElement("div");

    qustionBlock.classList.add("select");
    if (+opt.points === -1) {
      qustionBlock.classList.add("warn");
    } else if (+opt.points < -1) {
      qustionBlock.classList.add("mistake");
    } else if (+opt.points >= 10) {
      qustionBlock.classList.add("good");
    }

    if (question.type === "single") {
      qustionBlock.innerHTML = (`<input type="radio" id="${optionId}" name="${questionId}" data-score="${+opt.points}" ${!i ? "checked" : ""} data-skip="${+opt.skip}"/><label for="${optionId}">${opt.label}</label>`);
    } else if (question.type === "multi") {
      qustionBlock.innerHTML = (`<input type="checkbox" id="${optionId}" data-score="${+opt.points}" data-skip="${+opt.skip}"/><label for="${optionId}">${opt.label}</label>`);
    } else if (question.type === "input") {
      qustionBlock.innerHTML = (`<input type="number" value="0" min="0" max="9" id="${optionId}" data-score="${+opt.points}" data-skip="${+opt.skip}"/><label for="${optionId}">${opt.label}</label>`);
    }
    wrapper.append(qustionBlock);

    optionCounter++;
  });
  mainElement.append(wrapper);

  progressItem.id = progressId;
  progressItem.dataset.score = 0;
  progressItem.dataset.type = question.type;
  progressItem.title = (`Страница: ${question.page}, Блок: ${question.block}, Вопрос: ${question.comment}`);
  document.getElementById("progress").append(progressItem);

  if (questionCounter === 0) {
    currentPage = question.page;
    SCORE.dataset.page = currentPage;

    wrapper.classList.add("active");
    progressItem.classList.add("current");

    recalculateMainHeight(wrapper);
  }

  questionCounter++;
}


// STAGE 2
const NEXT = document.getElementById("next");
const PREV = document.getElementById("prev");
const FINISH = document.getElementById("finish");

// Count all points from all the options in current question.
const countScoreOfCurrentElement = (currentElement, currentProgressElement) => {
  let questionScore = 0;
  currentElement.childNodes.forEach((item) => {
    if (item.classList.contains("select")) {
      item.childNodes.forEach((i) => {

        // Calculate total points from optins of type "input".
        if (currentProgressElement.dataset.type === "input" && i.value) {
          questionScore += +(i.value * i.dataset.score);

        // Get points from optins of type "single" or "multi".
        } else if (i.checked) {
          questionScore += +i.dataset.score;
        }
      })
    }
  });
  return questionScore; // number
}

// Get number of questions, that will be skipped.
const getSkippedNumber = (currentElement, currentProgressElement) => {
  let skippedNumber = 0;
  currentElement.childNodes.forEach((item) => {
    if (item.classList.contains("select")) {
      item.childNodes.forEach((i) => {
        if (currentProgressElement.dataset.type === "single" && i.checked && +i.dataset.skip !== 0) {
          skippedNumber = +i.dataset.skip;
        }
      });
    }
  });
  return skippedNumber; // number
}

// Recursive function to get index of the element, which is situated before first skipped question in the block.
const findElementBeforeFirstSkipped = (index) => {
  const elem = document.getElementById(`p${currentQuestion - index}`)
  if (elem.classList.contains("skipped")) {
    elem.classList.remove("skipped");
    return findElementBeforeFirstSkipped(index + 1);
  }
  return index; // number
}

// Get page name parameter of the element.
const findNextOrPrevPage = (element) => {
  let pageName = "";
  element.childNodes.forEach((item) => {
    if (item.classList.contains("current-page")) {
      item.childNodes.forEach((i) => {
        if (i.classList.contains("current-page-value")) {
          pageName = i.innerHTML.toString();
        }
      })
    }
  });
  return pageName; // string
}

// Click handler of the button "Next".
NEXT.addEventListener("click", () => {
  const currentElement = document.getElementById(`q${currentQuestion}`);
  const currentProgressElement = document.getElementById(`p${currentQuestion}`);
  const splittedValue = SCORE.innerHTML.split("+");
  const currentScore = +splittedValue[splittedValue.length-1];
  const questionScore = +countScoreOfCurrentElement(currentElement, currentProgressElement);
  const skippingNumber = getSkippedNumber(currentElement, currentProgressElement) + 1;

  let nextElement = document.getElementById(`q${currentQuestion + 1}`);
  let nextProgressElement = document.getElementById(`p${currentQuestion + 1}`);
  let outcomeScore = 0;

  // Update state of the buttons.
  if (currentQuestion === 0) {
    PREV.disabled = false;
  }

  if (currentQuestion + skippingNumber + 1 >= questions.length) {
    NEXT.disabled = true;
    FINISH.disabled = false;
  }

  // Find queue position of next question.
  if (skippingNumber >= 1) {
    for (let i = 1; i < skippingNumber; i++) {
      document.getElementById(`p${currentQuestion + i}`).classList.add("skipped");
    }

    nextProgressElement = document.getElementById(`p${currentQuestion + skippingNumber}`);
    nextElement = document.getElementById(`q${currentQuestion + skippingNumber}`);
  }

  // Update score and calculate outcome score.
  splittedValue.pop();
  if (currentScore + questionScore <= 0) {
    outcomeScore = 0;
    if (currentScore === 0) {
      currentProgressElement.dataset.score = outcomeScore;
    } else {
      currentProgressElement.dataset.score = -currentScore;
    }
  } else {
    outcomeScore = currentScore + questionScore;
    currentProgressElement.dataset.score = questionScore;
  }

  // Update total score using outcome score and check if it is different page.
  const nextPage = findNextOrPrevPage(nextElement);
  if (nextPage !== "" && nextPage !== currentPage) {
    splittedValue.push(0);
    splittedValue.splice(splittedValue.length-1, 0, outcomeScore);
    currentPage = nextPage;
  } else {
    splittedValue.push(outcomeScore);
  }
  SCORE.innerHTML = splittedValue.join("+");

  // Update state of questoin blocks.
  currentProgressElement.classList.add("passed");
  currentProgressElement.classList.remove("current");
  currentElement.classList.remove("active");

  nextProgressElement.classList.add("current");
  nextElement.classList.add("active");

  recalculateMainHeight(nextElement);

  currentQuestion += skippingNumber;
});

// Click handler of the button "Previous".
PREV.addEventListener("click", () => {
  const curreontElement = document.getElementById(`q${currentQuestion}`);
  const currentProgressElement = document.getElementById(`p${currentQuestion}`);
  const splittedValue = SCORE.innerHTML.split("+");
  const currentScore = +splittedValue[splittedValue.length-1];
  const prevScore = +splittedValue[splittedValue.length-2];

  let previousElement = document.getElementById(`q${currentQuestion - 1}`);
  let previousProgressElement = document.getElementById(`p${currentQuestion-1}`);
  let skippingNumber = 1;
  let outcomeScore = 0;

  // Update state of the buttons.
  if (currentQuestion + 1 >= questions.length) {
    NEXT.disabled = false;
    FINISH.disabled = true;
  }

  if (currentQuestion - skippingNumber === 0) {
    PREV.disabled = true;
    NEXT.disabled = false;
  }

  // Find queue position of previous question.
  if (previousProgressElement.classList.contains("skipped")) {
    skippingNumber = findElementBeforeFirstSkipped(skippingNumber);
    previousProgressElement = document.getElementById(`p${currentQuestion - skippingNumber}`);
    previousElement = document.getElementById(`q${currentQuestion - skippingNumber}`);
  }

  // Update score and calculate outcome score and check if it is different page.
  const prevPage = findNextOrPrevPage(previousElement);
  let questionScore = +previousProgressElement.dataset.score;

  currentProgressElement.dataset.score = 0;

  if (prevPage !== currentPage) {
    outcomeScore = prevScore - questionScore;
    splittedValue.pop();
    splittedValue.pop();
    currentPage = prevPage;
  } else {
    outcomeScore = currentScore - questionScore;
    splittedValue.pop();
  }

  // Update total score using outcome score.
  splittedValue.push(outcomeScore);
  SCORE.innerHTML = splittedValue.join("+");

  // Update state of questoin blocks.
  curreontElement.classList.remove("active");
  currentProgressElement.classList.remove("current");

  previousElement.classList.add("active");
  previousProgressElement.classList.remove("passed");
  previousProgressElement.classList.add("current");

  recalculateMainHeight(previousElement);

  currentQuestion -= skippingNumber;
});

// Click handler of the button "Previous".
FINISH.addEventListener("click", () => {
  const currentElement = document.getElementById(`q${currentQuestion}`);
  const questionScore = countScoreOfCurrentElement(currentElement);
  const splittedValue = SCORE.innerHTML.split("+");
  const currentScore = splittedValue.reduce((a, c) => +a + +c);

  // Get and show final score.
  SCORE.innerHTML = +currentScore + questionScore;
  if (+SCORE.innerHTML <= 0) SCORE.innerHTML = 0;

  document.getElementById("total-score").innerHTML = SCORE.innerHTML;
  document.getElementById("stage-2").classList.add("hidden");
  document.getElementById("stage-3").classList.remove("hidden");
});

// STAGE 3 (create Feedback)
