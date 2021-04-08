const SCORE = document.getElementById("score");
let questions = [];
let questionCounter = 0;
let currentPage = "";
let currentQuestion = 0;
let optionCounter = 0;

// STAGE 1

const START = document.getElementById("start");
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


// STAGE 2

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


const createQuestion = (question) => {
  const questionId = `q${questionCounter}`;
  const progressId = `p${questionCounter}`;
  const mainElement = document.getElementById("main");

  const wrapper = document.createElement("div");
  wrapper.classList.add("question");
  wrapper.id = questionId;

  questionCounter++;

  wrapper.innerHTML = wrapper.innerHTML + (`<div class="current-page"><p>Страница: </p><p class="current-page-value">${question.page}</p></div>`);
  wrapper.innerHTML = wrapper.innerHTML + (`<div class="current-block"><p>Блок: </p><p>${question.block}</p></div>`);
  wrapper.innerHTML = wrapper.innerHTML + (`<div class="current-comment"><p>${question.comment}</p></div>`);

  question.options.forEach((opt, i) => {
    const optionId = `o${optionCounter}`;
    optionCounter++;
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
  });

  mainElement.append(wrapper);
  const progressItem = document.createElement("div");
  progressItem.classList.add("not-passed");
  progressItem.id = progressId;
  progressItem.dataset.score = 0;
  progressItem.dataset.type = question.type;
  progressItem.title = `Страница: ${question.page}, Блок: ${question.block}, Вопрос: ${question.comment}`;
  document.getElementById("progress").append(progressItem);

  if (questionId === "q0") {
    currentPage = question.page;
    SCORE.dataset.page = question.page;
    wrapper.classList.add("active");
    progressItem.classList.add("current");
    recalculateMainHeight(wrapper);
  }
}

const NEXT = document.getElementById("next");
const PREV = document.getElementById("prev");
const FINISH = document.getElementById("finish");

const countScoreOfCurrentElement = (currentElement, currentProgressElement) => {
  let questionScore = 0;
  currentElement.childNodes.forEach((item) => {
    if (item.classList.contains("select")) {
      item.childNodes.forEach((i) => {
        if (currentProgressElement.dataset.type === "input" && i.value) {
          questionScore += +(i.value * i.dataset.score);
        } else if (i.checked) {
          questionScore += +i.dataset.score;
        }
      })
    }
  });
  return questionScore;
}

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
  return skippedNumber;
}

const findElementBeforeFirstSkipped = (ind) => {
  const elem = document.getElementById(`p${currentQuestion - ind}`)
  if (elem.classList.contains("skipped")) {
    elem.classList.remove("skipped");
    return findElementBeforeFirstSkipped(ind + 1);
  }
  return ind;
}



const findNextOrPrevPage = (nextElement) => {
  let pageName = "";
  nextElement.childNodes.forEach((item) => {
    if (item.classList.contains("current-page")) {
      item.childNodes.forEach((i) => {
        if (i.classList.contains("current-page-value")) {
          pageName = i.innerHTML;
        }
      })
    }
  });
  return pageName;
}



NEXT.addEventListener("click", () => {
  const currentElement = document.getElementById(`q${currentQuestion}`);
  const currentProgressElement = document.getElementById(`p${currentQuestion}`);
  const splittedValue = SCORE.innerHTML.split("+");
  const currentScore = +splittedValue[splittedValue.length-1];

  let nextElement = document.getElementById(`q${currentQuestion + 1}`);
  let nextProgressElement = document.getElementById(`p${currentQuestion + 1}`);

  const questionScore = countScoreOfCurrentElement(currentElement, currentProgressElement);
  const skipingNumber = getSkippedNumber(currentElement, currentProgressElement) + 1;

  currentProgressElement.classList.add("passed");
  currentProgressElement.classList.remove("current");
  currentElement.classList.remove("active");

  if (currentQuestion === 0) {
    PREV.disabled = false;
  }

  if (skipingNumber >= 1) {
    for (let i = 1; i < skipingNumber; i++) {
      document.getElementById(`p${currentQuestion + i}`).classList.add("skipped");
    }

    nextProgressElement = document.getElementById(`p${currentQuestion + skipingNumber}`);
    nextElement = document.getElementById(`q${currentQuestion + skipingNumber}`);
  }

  if (currentQuestion + skipingNumber + 1 >= questions.length) {
    NEXT.disabled = true;
    FINISH.disabled = false;
  }

  const nextPage = findNextOrPrevPage(nextElement);
  if (nextPage !== "" && nextPage !== currentPage) {
    if (questionScore >= 0) {
      splittedValue.pop();
      splittedValue.push(0);
      console.log("(currentScore + questionScore) ", (currentScore + questionScore));
      currentProgressElement.dataset.score = +questionScore;
      splittedValue.splice(splittedValue.length-1, 0, (currentScore + questionScore));
      SCORE.innerHTML = splittedValue.join("+");
    }
    currentPage = nextPage;
  } else {
    splittedValue.pop();

    if (currentScore + questionScore <= 0) {
      if (currentScore === 0) {
        currentProgressElement.dataset.score = 0;
        splittedValue.push(0);
        SCORE.innerHTML = splittedValue.join("+");
      } else {
        currentProgressElement.dataset.score = -currentScore;
        splittedValue.push(0);
        SCORE.innerHTML = splittedValue.join("+");
      }
    } else {
      currentProgressElement.dataset.score = +questionScore;
      splittedValue.push(+currentScore + questionScore);
      SCORE.innerHTML = splittedValue.join("+");
    }
  }




  nextProgressElement.classList.add("current");
  nextElement.classList.add("active");

  recalculateMainHeight(nextElement);
  currentQuestion += skipingNumber;
});

PREV.addEventListener("click", () => {
  const curreontElement = document.getElementById(`q${currentQuestion}`);
  const currentProgressElement = document.getElementById(`p${currentQuestion}`);
  const splittedValue = SCORE.innerHTML.split("+");
  const currentScore = +splittedValue[splittedValue.length-1];
  const prevScore = +splittedValue[splittedValue.length-2];

  let previousElement = document.getElementById(`q${currentQuestion - 1}`);
  let previousProgressElement = document.getElementById(`p${currentQuestion-1}`);

  let skipingNumber = 1;

  if (currentQuestion + 1 >= questions.length) {
    NEXT.disabled = false;
    FINISH.disabled = true;
  }

  curreontElement.classList.remove("active");
  currentProgressElement.classList.remove("current");

  if (previousProgressElement.classList.contains("skipped")) {
    skipingNumber = findElementBeforeFirstSkipped(skipingNumber);
    previousProgressElement = document.getElementById(`p${currentQuestion - skipingNumber}`);
    previousElement = document.getElementById(`q${currentQuestion - skipingNumber}`);
  }

  previousElement.classList.add("active");
  previousProgressElement.classList.remove("passed");
  previousProgressElement.classList.add("current");

  const prevPage = findNextOrPrevPage(previousElement);
  console.log("currentPage ", currentPage);
  console.log("prevPage ", prevPage);
  let questionScore = previousProgressElement.dataset.score;
  if (prevPage !== currentPage) {
    console.log("splittedValue length ", splittedValue, splittedValue.length);
    splittedValue.pop();
    splittedValue.pop();
    currentProgressElement.dataset.score = 0;
    splittedValue.push(0);
    SCORE.innerHTML = splittedValue.join("+");
    currentPage = prevPage;
  } else {
    let questionScore = previousProgressElement.dataset.score;
    splittedValue.pop();
    currentProgressElement.dataset.score = 0;
    splittedValue.push(currentScore - +questionScore);
    SCORE.innerHTML = splittedValue.join("+");
  }





  if (currentQuestion - skipingNumber === 0) {
    PREV.disabled = true;
    NEXT.disabled = false;
  }

  recalculateMainHeight(previousElement);
  currentQuestion -= skipingNumber;
});

FINISH.addEventListener("click", () => {
  const currentElement = document.getElementById(`q${currentQuestion}`);
  const questionScore = countScoreOfCurrentElement(currentElement);
  const splittedValue = SCORE.innerHTML.split("+");
  const currentScore = splittedValue.reduce((a, c) => +a + +c);
  SCORE.innerHTML = +currentScore + questionScore;
  if (+SCORE.innerHTML <= 0) SCORE.innerHTML = 0;
  document.getElementById("total-score").innerHTML = SCORE.innerHTML;
  document.getElementById("stage-2").classList.add("hidden");
  document.getElementById("stage-3").classList.remove("hidden");
});
