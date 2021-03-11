const Scene = require('Scene');
const M = require('Materials');
const T = require('Textures');
const FaceTracking = require('FaceTracking');
const R = require('Reactive');
const TouchGestures = require('TouchGestures');
const Instruction = require('Instruction');
const Audio = require('Audio');
const Time = require('Time');
const Patches = require('Patches');


// Use export keyword to make a symbol available in scripting debug console
export const Diagnostics = require('Diagnostics');

// Enables async/await in JS [part 1]
(async function() {

const [boardObj, answersObj, answer1Obj, answer2Obj, answer3Obj, ansNote1Obj, ansNote2Obj, 
      ansNote3Obj, boardMat, answer1Mat, answer2Mat, answer3Mat, start_tex, answerDeffaultTex, answerCorrectTex, 
      answerWrongTex, answer_note_text1, answer_note_text2, answer_note_text3, answer_note_text4, answer_note_text5, 
      answer_note_text6, answer_note_text7, answer_note_text8, note1, note2, note3, note4, note5, note6, 
      note7, note8, answerNote1Mat, answerNote2Mat, answerNote3Mat, leftLeanHead, rightLeanHead, upLeanHead,] = await Promise.all([
  Scene.root.findFirst('note_board'),
  Scene.root.findFirst('answers'),
  Scene.root.findFirst('answer1'),
  Scene.root.findFirst('answer2'),
  Scene.root.findFirst('answer3'),
  Scene.root.findFirst('ansNote1'),
  Scene.root.findFirst('ansNote2'),
  Scene.root.findFirst('ansNote3'),
  M.findFirst('noteBoard_mat'),
  M.findFirst('answer1_mat'),
  M.findFirst('answer2_mat'),
  M.findFirst('answer3_mat'),
  T.findFirst('noteStart'),
  T.findFirst('answer_deffault'),
  T.findFirst('answer_correct'),
  T.findFirst('answer_wrong'),
  T.findFirst('answer_note_text1'),
  T.findFirst('answer_note_text2'),
  T.findFirst('answer_note_text3'),
  T.findFirst('answer_note_text4'),
  T.findFirst('answer_note_text5'),
  T.findFirst('answer_note_text6'),
  T.findFirst('answer_note_text7'),
  T.findFirst('answer_note_text8'),
  T.findFirst('note_1'),
  T.findFirst('note_2'),
  T.findFirst('note_3'),
  T.findFirst('note_4'),
  T.findFirst('note_5'),
  T.findFirst('note_6'),
  T.findFirst('note_7'),
  T.findFirst('note_8'),
  M.findFirst('answerNote1Mat'),
  M.findFirst('answerNote2Mat'),
  M.findFirst('answerNote3Mat'),
  Patches.outputs.getPulse('leftLeanHead'),
  Patches.outputs.getPulse('rightLeanHead'),
  Patches.outputs.getPulse('upLeanHead'),
]);

// Audio
const carousel_sound_controller = Audio.getAudioPlaybackController('carousel_sound_controller');
const correctAnswer_sound_controller = Audio.getAudioPlaybackController('correct_answer_controller');
const wrongAnswer_sound_controller = Audio.getAudioPlaybackController('wrong_sound_controller');

// Arrays
const answerNoteArray = [answer_note_text1, answer_note_text2, 
  answer_note_text3, answer_note_text4, 
  answer_note_text5, answer_note_text6, 
  answer_note_text7, answer_note_text8];// Надписи нот До, Ре, Ми, Фа, Соль, Ля, Си, До
const noteArray = [note1, note2, note3, note4, note5, note6, note7, note8];// Ноты на бумаге, которые рандомно генерируются в начале
const ansNoteMatArray = [answerNote1Mat, answerNote2Mat, answerNote3Mat];

//Instructions
Instruction.bind(false, 'tap_to_reply');
Instruction.bind(true, 'effect_include_sound');
// Time.setTimeout((e) => {
//   Instruction.bind(true, 'tap_to_play');
// }, 5000);


//Game board setup
boardObj.width = 0.18;
boardObj.height = 0.13;
boardMat.diffuse = start_tex;

//Answers setup
answer1Mat.diffuse = answerDeffaultTex;
answer2Mat.diffuse = answerDeffaultTex;
answer3Mat.diffuse = answerDeffaultTex;


// Answer cloud (cell) scale
answer1Obj.width = answer2Obj.width = answer3Obj.width = 0.127;
answer1Obj.height = answer2Obj.height = answer3Obj.height = 0.11;

// Clouds with answers are not visible antill randomizer worked
answer1Obj.hidden = answer2Obj.hidden = answer3Obj.hidden = true;
ansNote1Obj.hidden = ansNote2Obj.hidden = ansNote3Obj.hidden = true; //Text on the answer cloud

//Gameboard & Answers face tracking (movement)
const facePositionX =  FaceTracking.face(0).cameraTransform.position.x,
      facePositionY =  FaceTracking.face(0).cameraTransform.position.y,
      facePositionZ =  FaceTracking.face(0).cameraTransform.position.z;

const faceRotationX =  FaceTracking.face(0).cameraTransform.rotationX,
      faceRotationY =  FaceTracking.face(0).cameraTransform.rotationY;

boardObj.transform.position = R.pack3(R.expSmooth(facePositionX, 200), R.expSmooth(R.add(-0.18, facePositionY), 200), R.expSmooth(R.add(0.43, facePositionZ), 200));
boardObj.transform.rotationX = R.expSmooth(faceRotationX, 200);
boardObj.transform.rotationY = R.expSmooth(faceRotationY, 200);

answersObj.transform.position = R.pack3(R.expSmooth(facePositionX, 400), R.expSmooth(R.add(0.1, facePositionY), 400), R.expSmooth(R.add(0.4, facePositionZ), 400));
answersObj.transform.rotationX = R.expSmooth(faceRotationX, 400);
answersObj.transform.rotationY = R.expSmooth(faceRotationY, 400);

let isTapTrigger = false;
let canGuess = false;
var imageRandInterval = null;
var imageRandTimeout;

var answerInfo;


// Action when regicter screen tap
TouchGestures.onTap().subscribe((e) => {
  Instruction.bind(false, 'tap_to_play');

  // Main Game cycle==============================
  if(isTapTrigger == false) {
    imageRandTimeout = null;
    var correctAnswer;

    //Randomizer sound effect
    carousel_sound_controller.then((pbController) => {
      pbController.reset();
      pbController.setPlaying(true);
    });

    //Random notes on the game board

    let buff = 100;
    boardMat.diffuse = noteArray[setRandomBetween(0, 7)];
    
    imageRandInterval = Time.setInterval(function() {
      let rand = setRandomBetween(0, 7);
      
      if(buff == rand) {
        rand++;
        if(rand == 8) { //to avoid overflow
          rand = 0;
        }
      }
      buff = rand;
      boardMat.diffuse = noteArray[rand];
      correctAnswer = buff;
    }, 150);

    //Time guessing will start after (and randomizer stops)
    imageRandTimeout = Time.setTimeout(function() {
      Time.clearInterval(imageRandInterval);

      // Answer variants appear
      answer1Obj.hidden = answer2Obj.hidden = answer3Obj.hidden = false;
      ansNote1Obj.hidden = ansNote2Obj.hidden = ansNote3Obj.hidden = false;

      // setAnswersToGuess() function - generates answers variants and in which cell they will be
      // tracks head lean
      answerInfo = setAnswersToGuess(correctAnswer);
      canGuess = true;
      Instruction.bind(true, 'tilt_head');
    }, 2950);

    isTapTrigger = true;
    Diagnostics.log(isTapTrigger);

  } else if (isTapTrigger == true) {  //Конец игры
    Instruction.bind(true, 'tap_to_play');

    answer1Mat.diffuse = answerDeffaultTex;
    answer2Mat.diffuse = answerDeffaultTex;
    answer3Mat.diffuse = answerDeffaultTex;


    carousel_sound_controller.then((pbController) => {
      pbController.setPlaying(false);
      // pbController.reset();
    });
    correctAnswer_sound_controller.then((pbController) => {
      pbController.setPlaying(false);
      pbController.reset();
    });
    wrongAnswer_sound_controller.then((pbController) => {
      pbController.setPlaying(false);
      pbController.reset();
    });

    answerNote1Mat.diffuse = null;
    answerNote2Mat.diffuse = null;
    answerNote3Mat.diffuse = null;

    answer1Obj.hidden = answer2Obj.hidden = answer3Obj.hidden = true;
    ansNote1Obj.hidden = ansNote2Obj.hidden = ansNote3Obj.hidden = true;

    Time.clearInterval(imageRandInterval);
    Time.clearTimeout(imageRandTimeout);
    boardMat.diffuse = start_tex;
    Diagnostics.log(isTapTrigger);

    canGuess = false;
    isTapTrigger = false;
  }
});


leftLeanHead.subscribe(function() {
  Instruction.bind(false, 'tilt_head');

  if(canGuess) {
    Diagnostics.log('In-game Left');

    if (answerInfo.correctAnswerCell == 0) {
      answer1Mat.diffuse = answerCorrectTex;
      correctAnswer_sound_controller.then((pbController) => {
        pbController.setPlaying(true);
        pbController.reset();
      });
    } else if (answerInfo.secondAnswerCell == 0) {
      answer1Mat.diffuse = answerWrongTex;
      wrongAnswer_sound_controller.then((pbController) => {
        pbController.setPlaying(true);
        pbController.reset();
      });
    } else if (answerInfo.thirdAnswerCell == 0) {
      answer1Mat.diffuse = answerWrongTex;
      wrongAnswer_sound_controller.then((pbController) => {
        pbController.setPlaying(true);
        pbController.reset();
      });
    }
  }
  Instruction.bind(true, 'tap_to_reply');
});

upLeanHead.subscribe(function() {
  Instruction.bind(false, 'tilt_head');

  if(canGuess) {
    Diagnostics.log('In-game Up');

    if (answerInfo.correctAnswerCell == 1) {
      answer2Mat.diffuse = answerCorrectTex;
      correctAnswer_sound_controller.then((pbController) => {
        pbController.setPlaying(true);
        pbController.reset();
      });
    } else if (answerInfo.secondAnswerCell == 1) {
      answer2Mat.diffuse = answerWrongTex;
      wrongAnswer_sound_controller.then((pbController) => {
        pbController.setPlaying(true);
        pbController.reset();
      });
    } else if (answerInfo.thirdAnswerCell == 1) {
      answer2Mat.diffuse = answerWrongTex;
      wrongAnswer_sound_controller.then((pbController) => {
        pbController.setPlaying(true);
        pbController.reset();
      });
    }
  }
  Instruction.bind(true, 'tap_to_reply');
});

rightLeanHead.subscribe(function() {
  Instruction.bind(false, 'tilt_head');
  
  if(canGuess) {
    Diagnostics.log('In-game Right');
    
    if (answerInfo.correctAnswerCell == 2) {
      answer3Mat.diffuse = answerCorrectTex;
      correctAnswer_sound_controller.then((pbController) => {
        pbController.setPlaying(true);
        pbController.reset();
      });
    } else if (answerInfo.secondAnswerCell == 2) {
      answer3Mat.diffuse = answerWrongTex;
      wrongAnswer_sound_controller.then((pbController) => {
        pbController.setPlaying(true);
        pbController.reset();
      });
    } else if (answerInfo.thirdAnswerCell == 2) {
      answer3Mat.diffuse = answerWrongTex;
      wrongAnswer_sound_controller.then((pbController) => {
        pbController.setPlaying(true);
        pbController.reset();
      });
    }
  }
  Instruction.bind(true, 'tap_to_reply');
});



function setRandomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}


function setAnswersToGuess(correctAnswer) {
  // One is a correct answer
  let correctAnsPosition = setRandomBetween(0, 2);
  //Two other are wrong answers
  let arr = [0, 1, 2];

  // Delete chosen(correct) answer cell to work with two others
  arr.splice(correctAnsPosition, 1);

  // Choose other two answers randomly
  let secondAns, 
    thirdAns;
  let secondAnsPos = arr[0];
  let thirdAnsPos = arr[1];

  // Выбираем остальные два варианта ответа, которые не равны друг другу.
  if(correctAnswer == 0 || correctAnswer == 7) {
    secondAns = setRandomBetween(1, 6);

    do {
      thirdAns = setRandomBetween(1, 6);
    } while(thirdAns == secondAns);
  } else {
    do {
      secondAns = setRandomBetween(1, 7);
    } while(secondAns == correctAnswer);
  
    do {
      thirdAns = setRandomBetween(1, 7);
    } while(thirdAns == correctAnswer || thirdAns == secondAns);
  }

  // Set answers materials
  ansNoteMatArray[correctAnsPosition].diffuse = answerNoteArray[correctAnswer];
  ansNoteMatArray[secondAnsPos].diffuse = answerNoteArray[secondAns];
  ansNoteMatArray[thirdAnsPos].diffuse = answerNoteArray[thirdAns];
  
  Diagnostics.log('Correct Note Position: ' + correctAnsPosition);
  Diagnostics.log('Correct Note: ' + correctAnswer);
  Diagnostics.log('First wrong Note Position: ' + secondAnsPos);
  Diagnostics.log('First wrong Note: ' + secondAns);
  Diagnostics.log('Second wrong Note Position: ' + thirdAnsPos);
  Diagnostics.log('Second wrong Note: ' + thirdAns); 

  return {
    correctAnswer: correctAnswer,
    correctAnswerCell: correctAnsPosition,
    secondAnswer: secondAns,
    secondAnswerCell: secondAnsPos,
    thirdAnswer: thirdAns,
    thirdAnswerCell: thirdAnsPos
  }
}

})(); 
